import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';

import { IApiResponse, InitialApiValue } from '@/Api/common';
import { GetConvivesAbsences, SaveAbsenceModifierAsync } from '@/Api/convives';
import { GetRepasServicesAsync } from '@/Api/repas';
import { GetHorairesBlocageServicePatientGroupeAsync2, GetVerrousCommandeServiceAsync2 } from '@/Api/verrousRepas';

import { traductionAtom } from '@/Atoms/TraductionAtom';

import VueAbsencesLegend from '@/Components/VueAbsences/VueAbsencesLegend/VueAbsencesLegend';
import ApiResponseError from '@/Components/_Common/ApiResponseError/ApiResponseError';
import { HButton, HButtonType } from '@/Components/_Common/HButton/HButton';
import LoadingPanel from '@/Components/_Common/LoadingPanel/LoadingPanel';
import NavigationDate from '@/Components/_Common/NavigationDate/NavigationDate';
import ServiceDropDownList from '@/Components/_Common/ServiceDropDownList/ServiceDropDownList';
import TopControls from '@/Components/_Common/TopControls/TopControls';
import Vue from '@/Components/_Common/Vue/Vue';

import { useNotifications } from '@/Hooks/useNotifications';

import { ABSENCE_MODIFIER_INITIAL, IAbsenceDateeModifierEtat, IAbsenceModifier, IConviveAbsences, TypeConvive } from '@/Models/Convive';
import { IRepas, IServiceRepasIntranet } from '@/Models/Menu/Repas';
import { IServiceSelectionAsyncState } from '@/Models/ServiceSelectionAsyncState';
import { IAbsenceDatee } from '@/Models/Structure/Absence';
import { HttpStatusCode } from '@/Models/Utils/HttpStatusCodes';
import { IHoraireBlocageService } from '@/Models/VerrousRepas/HoraireBlocageService';
import { IVerrouCommandeService } from '@/Models/VerrousRepas/VerrouCommandeService';

import { nl2p } from '@/Utils/Helpers';
import { unionServiceRepasIntranet } from '@/Utils/HelpersMetiers';

import { FormatDateToApiDate } from '@/Models/DateRepas/DateRepas';
import GridAbsence from '@/Components/VueAbsences/GridAbsence';
import FonctionInterdite from '@/Components/FonctionInterdite/FonctionInterdite';
import { DroitAbsence, IDroitPermis } from '@/Models/Utilisateur/Droit';
import { IUtilisateur } from '@/Models/Utilisateur/Utilisateur';
import { utilisateurAtom } from '@/Atoms/UtilisateurAtom';
import { conviveShouldReloadAtom } from '@/Atoms/ConviveAtom';

import './VueAbsences.scss';

/**
 * Interface des props/children du composant
 */
interface IVueAbsencesOwnProps
{
}

/**
 * Composant représentant la vue générale
 * @param props les props react
 * @returns le composant VueAbsences
 */
export default function VueAbsences(props: Readonly<IVueAbsencesOwnProps>): JSX.Element
{
    // CONSTANTES LOCALES
    const horairesBlocageServiceDefault = useMemo(() => new InitialApiValue<Undefable<IHoraireBlocageService[]>>(undefined), []);
    const verrousCommandeServiceDefault = useMemo(() => new InitialApiValue<Undefable<IVerrouCommandeService[]>>(undefined), []);
    const conviveAbsencesDefault = useMemo(() => new InitialApiValue<Undefable<IConviveAbsences[]>>(undefined), []);
    const saveAbsenceAsyncDefault = useMemo(() => new InitialApiValue<Undefable<boolean>>(undefined), []);

    // STATES
    const traduction = useAtomValue(traductionAtom);
    // Etat typé pour inclure la requête du composant ServicesMultiSelectTree
    const [serviceSelectionAsyncState, setServiceSelectionAsyncState] = useState<Undefable<IServiceSelectionAsyncState>>(undefined);
    const [convivesAbsences, setConvivesAbsences] = useState<IApiResponse<Undefable<IConviveAbsences[]>>>(conviveAbsencesDefault);
    const [horairesBlocageService, setHorairesBlocageService] = useState<IApiResponse<Undefable<IHoraireBlocageService[]>>>(horairesBlocageServiceDefault);
    const [verrousCommandeService, setVerrousCommandeService] = useState<IApiResponse<Undefable<IVerrouCommandeService[]>>>(verrousCommandeServiceDefault);
    const [saveAbsenceAsyncState, setSaveAbsenceAsyncState] = useState<IApiResponse<Undefable<boolean>>>(saveAbsenceAsyncDefault);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [decalageDateDebut] = useState<number>(0);
    const [decalageDateFin] = useState<number>(4);
    const [repas, setRepas] = useState<IRepas[]>([]);
    const [isModificationEnCours, setIsModificationEnCours] = useState<Undefable<boolean>>(undefined);
    const [rechargementDonnee, setRechargementDonnee] = useState<number>(1);
    const utilisateur = useAtomValue(utilisateurAtom) as IUtilisateur; // Forcement connecté donc considéré non null via "as IUtilisateur"

    const [isSauvegardeEnCours, setIsSauvegardeEnCours] = useState<boolean>(false);

    const servicesRepasIntranets = useRef<IServiceRepasIntranet[]>([]);
    const absenceModifier = useRef<IAbsenceModifier>(ABSENCE_MODIFIER_INITIAL);
    const abortCtlConvivesAbsencesSave = useRef<AbortController>(new AbortController());

    const conviveShouldReloadToggle = useSetAtom(conviveShouldReloadAtom);
    // HOOKS
    /**
     * Permettra de gérer la sauvegarde s'il y a des modification en cours
     */
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => (isModificationEnCours ? isModificationEnCours : false)
            && currentLocation.pathname !== nextLocation.pathname);

    /**
     * permet l'envoi de notification visible par l'utilisateur
     */
    const { addNotification } = useNotifications();

    // FONCTIONS & CALLBACKS
    const currentDateString = useMemo(() => FormatDateToApiDate(currentDate), [currentDate]);

    /**
     * Fonction permettant la fusion des données lu par l'API avec celle saisie par l'utilisateur
     * @param conviveAbsenceApi : liste des objets IConvive absence lu par l'Api à fusionner avec les modifications
     */
    const fusionAbsencesAPIAbsencesSaisies = useCallback((conviveAbsenceApi: IConviveAbsences[]): IConviveAbsences[] =>
    {
        const convivesAbsencesASynchroniser: IConviveAbsences[] = [...conviveAbsenceApi];

        absenceModifier.current.absencesDateesModifiers.forEach(adm =>
        {
            const indexConvive = convivesAbsencesASynchroniser.findIndex(cas => cas.Id === adm.IdConvive);

            if (indexConvive > -1)
            {
                //on supprime la date repas des données API
                const absencesDateesTemp: IAbsenceDatee[] | undefined = convivesAbsencesASynchroniser[indexConvive]?.
                    AbsencesDatees?.filter(ad => ad.IdConsommateur !== adm.IdConvive || ad.Date !== adm.DateRepas.Date
                        || ad.IdRepas !== adm.DateRepas.Repas.Id);

                if (absencesDateesTemp)
                {
                    convivesAbsencesASynchroniser[indexConvive].AbsencesDatees = absencesDateesTemp;
                }
                else
                {
                    //le filtre a renvoyer un objet indéfinit, ce qui normalment est impossible
                }

                switch (adm.Etat)
                {
                    case IAbsenceDateeModifierEtat.Absent:
                        convivesAbsencesASynchroniser[indexConvive].AbsencesDatees?.push(
                            {
                                Id: undefined,
                                Date: adm.DateRepas.Date,
                                IdConsommateur: adm.IdConvive,
                                IdRepas: adm.DateRepas.Repas.Id,
                                IsAbsenceSinonPresence: true,
                            });
                        break;
                    case IAbsenceDateeModifierEtat.Present:
                        convivesAbsencesASynchroniser[indexConvive].AbsencesDatees?.push(
                            {
                                Id: undefined,
                                Date: adm.DateRepas.Date,
                                IdConsommateur: adm.IdConvive,
                                IdRepas: adm.DateRepas.Repas.Id,
                                IsAbsenceSinonPresence: false,
                            });
                        break;
                    case IAbsenceDateeModifierEtat.Supprimer:
                        //dejà fait par le filter
                        break;
                    default:
                        throw new Error("Cas non implémenté");
                }
            }
            else
            {
                //cette modification a été exclu car l'objet à fusionner à cette id convive absent
            }
        });
        return convivesAbsencesASynchroniser;
    }, []);

    /**
     * Callback de la fonction d'annulation
     */
    const annuleSauvegardeAbsence = useCallback((): void =>
    {
        absenceModifier.current.absencesDateesModifiers = [];
        setIsModificationEnCours(false);
        setRechargementDonnee(rechargementDonnee + 1);
    }, [rechargementDonnee]);

    /**
     * Callback de la fonction de sauvegarde
     */
    const sauvegardeAbsence = useCallback((): Promise<boolean> =>
    {
        return new Promise<boolean>((resolve, reject) =>
        {
            if (convivesAbsences && absenceModifier.current.absencesDateesModifiers.length > 0)
            {
                setIsSauvegardeEnCours(true);
                // On abandonne la possible requête en cours
                abortCtlConvivesAbsencesSave.current.abort();
                abortCtlConvivesAbsencesSave.current = new AbortController();

                SaveAbsenceModifierAsync(absenceModifier.current, false, abortCtlConvivesAbsencesSave.current.signal)
                    .then(reponse =>
                    {
                        setIsSauvegardeEnCours(false);

                        setSaveAbsenceAsyncState(reponse);
                        setIsModificationEnCours(false);

                        if (reponse.isError && reponse.statusCode !== HttpStatusCode.Forbidden)
                        {
                            addNotification(
                                {
                                    Uuid: uuidv4(),
                                    Content: traduction.Common.ErreurEnregistrementAbsence,
                                    closable: true,
                                    type:
                                    {
                                        icon: true,
                                        style: "error"
                                    }
                                });
                            resolve(false);
                        }
                        else if (reponse.isError)
                        {
                            resolve(false);
                        }
                        else
                        {
                            resolve(true);
                            absenceModifier.current.absencesDateesModifiers = [];
                            setRechargementDonnee(rechargementDonnee + 1);
                            conviveShouldReloadToggle();
                        }
                    });
            }
            else
            {
                resolve(true);
            }
        });
    }, [addNotification, conviveShouldReloadToggle, convivesAbsences, rechargementDonnee, traduction.Common.ErreurEnregistrementAbsence]);

    // EFFECTS
    /**
     * Lecture via l'api des absences, des verrous manuels de services et des horaires de blocage
     */
    useEffect(() =>
    {
        const abortCtlConvivesAbsences = new AbortController();
        const abortCtlVerrousCommandeService = new AbortController();
        const abortCtlHorairesBlocageServicePatientGroupe = new AbortController();

        setSaveAbsenceAsyncState(saveAbsenceAsyncDefault);

        if (serviceSelectionAsyncState && !serviceSelectionAsyncState.DataResponse.loading && serviceSelectionAsyncState.SelectedItem)
        {
            const idsServices: number[] = [serviceSelectionAsyncState.SelectedItem.Id];

            if (idsServices.length)
            {
                setConvivesAbsences(cab => ({ ...cab, loading: true }));
                setVerrousCommandeService(vcs => ({ ...vcs, loading: true }));
                setHorairesBlocageService(hbs => ({ ...hbs, loading: true }));

                Promise.all([
                    GetConvivesAbsences(
                        {
                            IdsServices: idsServices,
                            Date: currentDateString,
                            DecalageDateDebut: decalageDateDebut,
                            DecalageDateFin: decalageDateFin
                        },
                        conviveAbsencesDefault.data,
                        abortCtlConvivesAbsences.signal
                    ),
                    GetVerrousCommandeServiceAsync2(
                        {
                            IdsServices: idsServices,
                            Date: currentDateString,
                            DecalageDateDebut: decalageDateDebut,
                            DecalageDateFin: decalageDateFin
                        },
                        verrousCommandeServiceDefault.data,
                        abortCtlVerrousCommandeService.signal),
                    GetHorairesBlocageServicePatientGroupeAsync2(idsServices, horairesBlocageServiceDefault.data
                        , abortCtlHorairesBlocageServicePatientGroupe.signal),
                ]).then(([rAbsences, rVerrousCommande, rHorairesBlocage]) =>
                {
                    if (rAbsences.data)
                    {
                        rAbsences.data = fusionAbsencesAPIAbsencesSaisies(rAbsences.data);
                    }
                    else
                    {
                        //Il faut qu'il y ait des données pour pouvoir fusionner
                    }
                    setConvivesAbsences(rAbsences);
                    setVerrousCommandeService(rVerrousCommande);
                    setHorairesBlocageService(rHorairesBlocage);
                });
            }
        }
        else
        {
            setConvivesAbsences(conviveAbsencesDefault);
        }

        // Au démontage (TEARDOWN)
        return () =>
        {
            // On abandonne la possible requête en cours
            abortCtlConvivesAbsences.abort();
            abortCtlVerrousCommandeService.abort();
            abortCtlHorairesBlocageServicePatientGroupe.abort();
        };
    }, [currentDateString, decalageDateDebut, decalageDateFin, serviceSelectionAsyncState, conviveAbsencesDefault
        , verrousCommandeServiceDefault, horairesBlocageServiceDefault, fusionAbsencesAPIAbsencesSaisies, rechargementDonnee
        , saveAbsenceAsyncDefault]);

    // Lecture via l'api des repas à l'initialisation du composant
    useEffect(() =>
    {
        if (!serviceSelectionAsyncState || serviceSelectionAsyncState.DataResponse.loading || !serviceSelectionAsyncState.SelectedItem)
        {
            return; //les services ne sont pas chargés
        }

        const abortCtlRepasServices = new AbortController();
        const idsServices: number[] = [serviceSelectionAsyncState.SelectedItem.Id];

        //Récupération des repas
        GetRepasServicesAsync(idsServices, [], abortCtlRepasServices.signal)
            .then((response) =>
            {
                if (response.data?.length)
                {
                    servicesRepasIntranets.current = [...response.data];
                    setRepas(unionServiceRepasIntranet(servicesRepasIntranets.current));
                }
                else
                {
                    //Pas de repas
                }
            });

        return () =>
        {
            abortCtlRepasServices.abort();
        };
    }, [serviceSelectionAsyncState]);

    const GestionMessageApi = (): JSX.Element | undefined | boolean =>
    {
        return (

            (!serviceSelectionAsyncState || serviceSelectionAsyncState && serviceSelectionAsyncState.DataResponse.loading
                || !convivesAbsences || convivesAbsences && convivesAbsences.loading || !horairesBlocageService
                || horairesBlocageService && horairesBlocageService.loading || !verrousCommandeService
                || verrousCommandeService && verrousCommandeService.loading) &&
            <div className="vue-absences-chargement">
                <LoadingPanel />
            </div>
            || saveAbsenceAsyncState && saveAbsenceAsyncState.isError && saveAbsenceAsyncState.statusCode === HttpStatusCode.Forbidden &&
            <div className="vue-absences-erreur">
                <ApiResponseError response={saveAbsenceAsyncState}
                    title={<h1 className="k-text-error">{traduction.Common.DonneesNonSauvegardeesParManqueDeDroit}</h1>}
                />
            </div>
            || serviceSelectionAsyncState?.DataResponse.isError &&
            <div className="vue-absences-erreur">
                <ApiResponseError response={serviceSelectionAsyncState.DataResponse}
                    title={<h1 className="k-text-error">{traduction.Common.ImpossibleRecupererServices}</h1>}
                />
            </div>
            || serviceSelectionAsyncState?.DataResponse.isEmpty &&
            <div className="vue-absences-erreur">
                <h1 className="k-text-error">{traduction.Common.AucunService}</h1>
                <div>{nl2p(traduction.Common.AucunServiceDesc)}</div>
            </div>
            || convivesAbsences?.isError &&
            <div className="vue-absences-erreur">
                <ApiResponseError response={convivesAbsences}
                    title={<h1 className="k-text-error">{traduction.Common.ImpossibleRecupererAbsences}</h1>} />
            </div>
            || horairesBlocageService?.isError &&
            <div className="vue-absences-erreur">
                <ApiResponseError response={horairesBlocageService}
                    title={<h1 className="k-text-error">{traduction.Common.ImpossibleRecupererHorraireBlocage}</h1>} />
            </div>
            || verrousCommandeService?.isError &&
            <div className="vue-absences-erreur">
                <ApiResponseError response={verrousCommandeService}
                    title={<h1 className="k-text-error">{traduction.Common.ImpossibleRecupererVerrouService}</h1>} />
            </div>);
    };

    const droitVisualiser: Undefable<IDroitPermis[]> = useMemo(() =>
    {
        if (!utilisateur)
        {
            return undefined;
        }
        else
        {
            return [
                DroitAbsence(utilisateur, TypeConvive.Patient, false, true),
                DroitAbsence(utilisateur, TypeConvive.Patient, true, true),

                DroitAbsence(utilisateur, TypeConvive.Groupe, false, true),
                DroitAbsence(utilisateur, TypeConvive.Groupe, true, true),

                DroitAbsence(utilisateur, TypeConvive.Accompagnant, false, true),
                DroitAbsence(utilisateur, TypeConvive.Accompagnant, true, true),

                DroitAbsence(utilisateur, TypeConvive.Personnel, false, true)
            ];
        }
    }, [utilisateur]);

    return (
        <>
            {
                droitVisualiser &&
                <FonctionInterdite
                    IsAfficherDroitManquantSinonTousLesDroitsCacher={!droitVisualiser?.every(d => !d.IsDroitPermis)}
                    ListeDroitPourDeCacher={droitVisualiser}
                >
                    <Vue className="vue-absences">
                        <TopControls
                            controls={
                                <>
                                    <ServiceDropDownList
                                        setServiceSelectionAsyncState={setServiceSelectionAsyncState}
                                        label={traduction.Common.ServiceSelectionne}
                                        isInitialiseParServiceCourant
                                    />
                                    <NavigationDate
                                        date={currentDate}
                                        setDate={setCurrentDate}
                                        label={traduction.Common.PremiereDateAffichee}
                                        isAvecSemaine
                                    />
                                </>
                            }
                            buttons={
                                <>
                                    <HButton className="vue-absences-bouton-enregistrer"
                                        disabled={!isModificationEnCours}
                                        spType={HButtonType.Enregistrer}
                                        loading={isSauvegardeEnCours}
                                        size="large"
                                        onClick={() => sauvegardeAbsence()}
                                    />
                                    <HButton className="vue-absences-bouton-annuler"
                                        disabled={!isModificationEnCours}
                                        spType={HButtonType.Annuler}
                                        size="large"
                                        onClick={() => annuleSauvegardeAbsence()} />
                                </>
                            }
                            legend={{
                                contentTitle: traduction.Common.VueGeneraleAbsencesLegendTitle,
                                children: <VueAbsencesLegend />
                            }}
                        />
                        {
                            GestionMessageApi()
                            ||
                            <GridAbsence
                                decalageDateDebut={decalageDateDebut}
                                decalageDateFin={decalageDateFin}
                                convivesAbsences={convivesAbsences}
                                repas={repas}
                                currentDateString={currentDateString}
                                absenceModifier={absenceModifier.current}
                                setIsModificationEnCours={setIsModificationEnCours}
                                setConvivesAbsences={setConvivesAbsences}
                                serviceSelectionAsyncState={serviceSelectionAsyncState}
                                verrousCommandeService={verrousCommandeService}
                                horairesBlocageService={horairesBlocageService}
                                servicesRepasIntranets={servicesRepasIntranets.current}
                            />
                        }
                        {
                            blocker.state === "blocked"
                                ?
                                <Dialog className="vue-absences-dialog"
                                    title={traduction.Common.ModificationsNonSauvegardees}
                                    onClose={() => blocker.reset()}
                                >
                                    <div className="blocker-dialog-content">
                                        <p><br />{traduction.Common.BlockerModifNonEnregistrer}<br /></p>
                                    </div>
                                    <DialogActionsBar layout="center">
                                        <HButton spType={HButtonType.Enregistrer}
                                            onClick={() =>
                                            {
                                                sauvegardeAbsence();
                                                blocker.reset();
                                            }}
                                        />
                                        <HButton spType={HButtonType.NePasEnregistrer}
                                            onClick={() =>
                                            {
                                                annuleSauvegardeAbsence();
                                                blocker.reset();
                                            }}

                                        />
                                        <HButton spType={HButtonType.Annuler} onClick={() => blocker.reset()} />
                                    </DialogActionsBar>
                                </Dialog>
                                : null
                        }
                    </Vue>
                </FonctionInterdite>
            }
        </>
    );
}