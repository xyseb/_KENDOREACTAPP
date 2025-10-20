import { IApiResponse } from "@/Api/common";
import { traductionAtom } from "@/Atoms/TraductionAtom";
import { utilisateurAtom } from "@/Atoms/UtilisateurAtom";
import HGrid, { FieldNonExistant, IGridColumnPropsExtended, IGridCustomCellData, IColumnInformation, ISelectedItem, HCustomGridCellProps } from "@/Components/_Common/HGrid/HGrid";
import { HIconType, HIcons } from "@/Components/_Common/HIcons/HIcons";
import Identite from "@/Components/_Common/Identite/Identite";
import IndicateurAbsence, { IIndicateurAbsenceOwnProps } from "@/Components/_Common/IndicateurAbsence/IndicateurAbsence";
import { IAbsenceDateeModifierEtat, IAbsenceModifier, IConviveAbsences, TypeConvive } from "@/Models/Convive";
import { FormatDateAffichageHestia, FormatDateToApiDate, IDateRepas } from "@/Models/DateRepas/DateRepas";
import { IRepas, IServiceRepasIntranet } from "@/Models/Menu/Repas";
import { IServiceSelectionAsyncState } from "@/Models/ServiceSelectionAsyncState";
import { GetAbsence, IAbsenceData } from "@/Models/Structure/Absence";
import { ILit, ILitVueGenerale } from "@/Models/Structure/Lit";
import { ILocalisationPeriode } from "@/Models/Structure/Localisation";
import { DroitAbsence } from "@/Models/Utilisateur/Droit";
import { IUtilisateur } from "@/Models/Utilisateur/Utilisateur";
import { GetIsDateRepasVerouille, IHoraireBlocageService, RepasIsVerouillerIsModifiable, TypeBlocage } from "@/Models/VerrousRepas/HoraireBlocageService";
import { IVerrouCommandeService } from "@/Models/VerrousRepas/VerrouCommandeService";
import { GetTypeConviveRoute, RouteFicheConviveForId, RouteVueAbsences, TypeConviveRoute } from "@/Utils/Constants";
import { getNbDaysDiff, setTimeFromRepas } from "@/Utils/Helpers";
import { getLitsDuService } from "@/Utils/HelpersMetiers";
import { datefnsGetIndiceJour } from "@/Utils/date-fns-i18n-wrappers";
import { GridSelectionChangeEvent } from "@progress/kendo-react-grid";
import { Tooltip } from "@progress/kendo-react-tooltip";
import { useAtomValue } from "jotai/react";
import { useCallback, useMemo } from "react";
import { Link, useMatch } from "react-router-dom";

/**
 * Interface des props/children du composant
 */
interface IGridAbsenceOwnProps
{
    convivesAbsences: IApiResponse<Undefable<IConviveAbsences[]>>;
    repas: IRepas[];

    decalageDateDebut: number;
    decalageDateFin: number;
    currentDateString: DateStringType;

    absenceModifier: IAbsenceModifier;
    serviceSelectionAsyncState: Undefable<IServiceSelectionAsyncState>;

    verrousCommandeService: IApiResponse<Undefable<IVerrouCommandeService[]>>;
    horairesBlocageService: IApiResponse<Undefable<IHoraireBlocageService[]>>;
    servicesRepasIntranets: IServiceRepasIntranet[];

    setConvivesAbsences: (convivesAbsences: IApiResponse<Undefable<IConviveAbsences[]>>) => void;
    setIsModificationEnCours: (isModificationEnCours: Undefable<boolean>) => void;
}
/**
 * Representation d'un détail de ligne de données de la grille
 */
interface IConviveAbsencesDetailLigne
{
    absence: IAbsenceData;
    isVerrouiller: boolean;
    isModifiable: boolean;
    isValeurInconnu: boolean;
}

/**
 * Representation d'une ligne de données de la grille
 */
interface IConviveAbsencesLigne
{
    convive?: IConviveAbsences;
    absences: IUndefableDictionary<IGridCustomCellData<IConviveAbsencesDetailLigne>>;
    localisationActuelle: Undefable<ILocalisationPeriode>;
    litVueGenerale?: IGridCustomCellData<ILitVueGenerale>;
    individuelOuGroupe?: string;
}

/**
 * Permet de typer une clé correspondant à une date repas
 */
enum DateRepasStringType { __dateRepasStringType = "" }
type DateRepasKey = string & DateRepasStringType;

/**
 * Grille affichant les elements d'absence
 * @param props les props react
 * @returns le composant GridAbsence
 */
export default function GridAbsence(props: Readonly<IGridAbsenceOwnProps>): JSX.Element
{
    const traduction = useAtomValue(traductionAtom);
    const match = useMatch(`${RouteVueAbsences}/:detail?`);
    const utilisateur = useAtomValue(utilisateurAtom) as IUtilisateur; // Forcement connecté donc considéré non null via "as IUtilisateur"

    /**
     * type de convive fourni dans l'url
     */
    const typeConviveRoute: TypeConviveRoute | undefined = useMemo(() =>
    {
        return GetTypeConviveRoute(match?.params?.typeConviveRoute);
    }, [match]);

    /**
     * Permet d'obtenir une clé sous forme de string à partir d'une date repas pour pouvoir stocker les informations datées
     * @param dateRepas la date repas
     * @returns la clé
     */
    const GetKeyDateRepas = useCallback((dateRepas?: IDateRepas): DateRepasKey =>
    {
        if (dateRepas && props.currentDateString)
        {
            return `J${getNbDaysDiff(new Date(props.currentDateString), new Date(dateRepas.Date), true)}_${dateRepas.Repas.Id}` as DateRepasKey;
        }
        else
        {
            return 'champQuiNExistePas' as DateRepasKey;//On renvoi un champ qui ne pointe vers rien, le temps du chargement
        }
    }, [props.currentDateString]);

    /**
     * Représentation texte d'une absence
     * @param rc
     * @param fdd
     */
    const GetAbsenceDisplayText = useCallback((abs: IAbsenceData): string =>
    {
        return abs.IsAbsent ? traduction.Common.Absent : traduction.Common.Present;
    }, [traduction]);

    const datesRepasAffichees = useMemo(() =>
    {
        const datesRepas: IDateRepas[] = [];
        let nbJour = props.decalageDateDebut;
        while (nbJour <= props.decalageDateFin)
        {
            const date = new Date(props.currentDateString);
            date.setDate(date.getDate() + nbJour);
            const dateStr = FormatDateToApiDate(date);
            props.repas.forEach(r =>
            {
                const dateRepas: IDateRepas = {
                    Date: dateStr,
                    Repas: r
                };
                datesRepas.push(dateRepas);
            });
            nbJour++;
        }
        return datesRepas;
    }, [props.currentDateString, props.decalageDateDebut, props.decalageDateFin, props.repas]);

    /**
     * Fonction permettant d'enregistrer dans une liste les données à modifier en base suite aux actions utilisateurs
     * @param dateRepasAbsence : la date repas de l'absence modifié par l'utilisateur
     * @param idConviveAbsence : le convive modifié par l'utilisateur
     * @param etatAbsence : un etat peremttant de savoir quel action il faudra faire en base au moement de la sauvegarde
     */
    const setAbsencesDateesModifier = useCallback((dateRepasAbsence: IDateRepas, idConviveAbsence: number
        , etatAbsence: IAbsenceDateeModifierEtat): void =>
    {
        props.absenceModifier.absencesDateesModifiers = props.absenceModifier.absencesDateesModifiers.filter(
            am => am.DateRepas.Date !== dateRepasAbsence.Date || am.DateRepas.Repas.Id !== dateRepasAbsence.Repas.Id
                || am.IdConvive !== idConviveAbsence);

        props.absenceModifier.absencesDateesModifiers.push(
            {
                DateRepas: dateRepasAbsence,
                IdConvive: idConviveAbsence,
                Etat: etatAbsence,
            });
    }, [props.absenceModifier]);

    /**
     * Fonction mettant à jour la liste des absences datées suite aux actions utilisateurs
     * @param selectedsItems : liste des colonnes sélectionner, on retrouvera la cellule grace à l'id du convive
     * @param listeConvivesAbsences : la liste des absences du convives avant que l'utilisateur coche les cases
     * @returns la liste des absences datées suite aux actions utilisateurs
     */
    const modifieAbsencesDatees = useCallback((selectedsItems: ISelectedItem<IConviveAbsencesLigne>[],
        listeConvivesAbsences: IConviveAbsences[], isAbsencesExtension: boolean): IConviveAbsences[] =>
    {
        const convivesAbsencesCopies: IConviveAbsences[] = [...listeConvivesAbsences];

        selectedsItems.forEach(selectedItem =>
        {
            const conviveCopy = { ...selectedItem.dataItem.convive };

            if (conviveCopy?.Id)
            {
                const idConvive = conviveCopy.Id as number;

                const indexConvive = listeConvivesAbsences.findIndex(c => c.Id === conviveCopy.Id);
                //On sait qu'on est en sélection de type cells donc on cast et on ignore les 2 premières colonnes
                const columnsInformations = (selectedItem.selectedsColumnsInformations)?.filter(sci => sci.field
                    !== "convive.NomPrenom" && sci.field !== "localisationActuelle.Service.DesignationWithEtablissement");

                if (indexConvive === -1 || !columnsInformations?.length)
                {
                    //Le convive n'est plus présent dans l'écran, rien à faire
                }
                else
                {
                    const datesRepas: IDateRepas[] = columnsInformations.map(ci => ci.tag as IDateRepas);
                    let absencesDatees = conviveCopy.AbsencesDatees ? [...conviveCopy.AbsencesDatees] : [];
                    const absencesHebdo = conviveCopy.AbsencesHebdo ? [...conviveCopy.AbsencesHebdo] : [];

                    datesRepas.forEach(dr =>
                    {
                        const absenceDatee = absencesDatees.find(a => a.Date === dr.Date && a.IdRepas === dr.Repas.Id);
                        const jour = datefnsGetIndiceJour(dr.Date);
                        const absenceHebdo = absencesHebdo.find(a => a.Jour === jour && a.IdRepas === dr.Repas.Id);
                        //Remarque : On reprend la logique de la GCRi actuelle qui n'est pas toujours celle de la GCR
                        if (absenceDatee)
                        {
                            if (isAbsencesExtension && absenceDatee.IsAbsenceSinonPresence)
                            {
                                setAbsencesDateesModifier(dr, idConvive, IAbsenceDateeModifierEtat.Absent);
                            }
                            else
                            {
                                //On retire l'absence ou présence datée
                                //Attention : on ne peut pas se fier à l'id car on aura des undefined pour les ajouts faits côté front
                                //en attendant l'enregistrement
                                absencesDatees = absencesDatees.filter(a => !(a.Date === absenceDatee.Date && a.IdRepas
                                    === absenceDatee.IdRepas));
                                setAbsencesDateesModifier(dr, idConvive, IAbsenceDateeModifierEtat.Supprimer);
                            }
                        }
                        else
                        {
                            if (isAbsencesExtension && absenceHebdo)
                            {
                                //On ne fait rien
                            }
                            else if (absenceHebdo)
                            {
                                //Présence datée
                                absencesDatees.push({
                                    Id: undefined,
                                    Date: dr.Date,
                                    IdConsommateur: idConvive,
                                    IdRepas: dr.Repas.Id,
                                    IsAbsenceSinonPresence: false,
                                });
                                setAbsencesDateesModifier(dr, idConvive, IAbsenceDateeModifierEtat.Present);
                            }
                            else
                            {
                                absencesDatees.push({
                                    Id: undefined,
                                    Date: dr.Date,
                                    IdConsommateur: idConvive,
                                    IdRepas: dr.Repas.Id,
                                    IsAbsenceSinonPresence: true,
                                });
                                setAbsencesDateesModifier(dr, idConvive, IAbsenceDateeModifierEtat.Absent);
                            }
                        }
                    });
                    conviveCopy.AbsencesDatees = absencesDatees;
                    conviveCopy.AbsencesHebdo = absencesHebdo;
                }

                const conviveCopyDefini: IConviveAbsences = conviveCopy as IConviveAbsences;
                convivesAbsencesCopies[indexConvive] = conviveCopyDefini;
            }
            else
            {
                //Il faut une convive pour faire cette sauvegarde
            }
        });
        return convivesAbsencesCopies;
    }, [setAbsencesDateesModifier]);

    /**
     * Fonction permettant  de savoir s'il faut faire une extension des cellules absences ou pas. Si au moins une des dates
     * sélectionnées est une absence on "étend" les absences
     * @param selectedsItems : liste des colonnes sélectionner, on retrouvera la cellule grace à l'id du convive
     * @param listeConvivesAbsences : la liste des absences du convives avant que l'utilisateur coche les cases
     */
    const getIsExtensionCellule = useCallback((selectedsItems: ISelectedItem<IConviveAbsencesLigne>[],
        listeConvivesAbsences: IConviveAbsences[]): boolean =>
    {
        let isAbsencesExtension = false;
        let nbAbsencesSelected = 0;
        let nbDatesRepasSelected = 0;

        //On parcourt une première fois toutes les cellules sélectionnées pour déterminer si l'une d'elles correspond à une absence
        selectedsItems.forEach(selectedItem =>
        {
            const convive = selectedItem.dataItem.convive;

            if (convive?.Id)
            {
                const indexConvive = listeConvivesAbsences.findIndex(c => c.Id === convive.Id);

                //On sait qu'on est en sélection de type cells donc on cast et on ignore les 2 premières colonnes
                const columnsInformations = (selectedItem.selectedsColumnsInformations)?.filter(sci => sci.field
                    !== "convive.NomPrenom" && sci.field !== "localisationActuelle.Service.DesignationWithEtablissement");

                if (indexConvive === -1 || !columnsInformations?.length)
                {
                    //Le convive n'est plus présent dans l'écran, rien à faire
                }
                else
                {
                    const datesRepas: IDateRepas[] = columnsInformations.map(ci => ci.tag as IDateRepas);
                    nbDatesRepasSelected = nbDatesRepasSelected + datesRepas.length;

                    datesRepas.forEach(dr =>
                    {
                        const absenceDatee = (convive.AbsencesDatees ?? []).find(a => a.Date === dr.Date
                            && a.IdRepas === dr.Repas.Id);
                        const jour = datefnsGetIndiceJour(dr.Date);
                        const absenceHebdo = (convive.AbsencesHebdo ?? []).find(a => a.Jour === jour
                            && a.IdRepas === dr.Repas.Id);
                        if (absenceDatee)
                        {
                            if (absenceDatee.IsAbsenceSinonPresence)
                            {
                                isAbsencesExtension = true;
                                nbAbsencesSelected++;
                            }
                            else
                            {
                                //Présence datée, rien à faire
                            }
                        }
                        else if (absenceHebdo)
                        {
                            //absence hebdo (sans présence datée)
                            isAbsencesExtension = true;
                            nbAbsencesSelected++;
                        }
                    });
                }
            }
            else
            {
                //il faut un convive pour que je comptabilise une cellule comme séletionné
            }
        });

        if (nbAbsencesSelected === nbDatesRepasSelected)
        {
            //Si toutes les dates sélectionnées correspondent à une absence, il faut bien annuler l'absence
            isAbsencesExtension = false;
        }
        else
        {
            //la boucle précédente à géré la mise à jour de la variable isAbsencesExtension
        }

        return isAbsencesExtension;
    }, []);

    /**
     * Fonction retournant un nouveau tableau d'absence en fonction des cases cochées par l'utilisateur
     * @param selectedsItems : liste des colonnes sélectionner, on retrouvera la cellule grace à l'id du convive
     * @param listeConvivesAbsences : la liste des absences du convives avant que l'utilisateur coche les cases
     * @returns la liste de conviveAbsence modifié intégrant les dernières modifications ainsi que les précédentes
     */
    const getConvivesAbsencesModifierParSaisie = useCallback((selectedsItems: ISelectedItem<IConviveAbsencesLigne>[],
        listeConvivesAbsences: IConviveAbsences[]): IConviveAbsences[] =>
    {
        return modifieAbsencesDatees(selectedsItems, listeConvivesAbsences, getIsExtensionCellule(selectedsItems
            , listeConvivesAbsences));
    }, [getIsExtensionCellule, modifieAbsencesDatees]);

    /**
     * Fonction gèrant les actions à effectuer lors de la selection des cellules par l'utilisateur

    const onSelectedItemsChange = useCallback((selectedsItems: ISelectedItem<IConviveAbsencesLigne>[]): void =>
    {
        const convivesAbsences = {
            ...props.convivesAbsences,
            data: props.convivesAbsences.data ? getConvivesAbsencesModifierParSaisie(selectedsItems, props.convivesAbsences.data) : undefined
        };

        if (props.setConvivesAbsences)
        {
            props.setConvivesAbsences(convivesAbsences);
        }

        props.setIsModificationEnCours(true);
    }, [getConvivesAbsencesModifierParSaisie, props]);*/

    const onSelectedItemsChange = useCallback((event: GridSelectionChangeEvent) =>
    {
        console.log("event.select");
        console.log(event.select);
    }, []);

    /**
     * function permettant de construire la liste des valeur du dictionnaire pour chacune des dates repas pour permettre son affichage par la grille
     * @param conviveAbsence un objet conviveabsence contenant les informations d'absences du convive pour les différentes date repas
     * @param localisationActuelle la localisation actuelle
     * @returns un dictionaire renseignant une valeure pour chacune des dates repas
     */
    const getLigneGrilleDetails = useCallback((conviveAbsence: IConviveAbsences | undefined
        , localisationActuelle: ILocalisationPeriode | undefined)
        : IUndefableDictionary<IGridCustomCellData<IConviveAbsencesDetailLigne>> =>
    {
        const detailsLignes: IUndefableDictionary<IGridCustomCellData<IConviveAbsencesDetailLigne>> = {};
        if (conviveAbsence)
        {
            datesRepasAffichees.forEach(dateRepas =>
            {
                const dateRepasKey = GetKeyDateRepas(dateRepas);

                if (conviveAbsence?.AbsencesDatees && conviveAbsence?.AbsencesHebdo && props.horairesBlocageService.data
                    && props.verrousCommandeService.data)
                {
                    const abs: IAbsenceData = GetAbsence(
                        {
                            IdConvive: conviveAbsence.Id,
                            AbsencesDatees: conviveAbsence.AbsencesDatees,
                            AbsencesHebdos: conviveAbsence.AbsencesHebdo,
                        }, dateRepas);

                    const repasIsVerouillerIsModifiable: RepasIsVerouillerIsModifiable = GetIsDateRepasVerouille(
                        TypeBlocage.PatientOuGroupe, dateRepas, localisationActuelle?.Service?.Id,
                        props.horairesBlocageService.data, props.verrousCommandeService.data, utilisateur);

                    const isValeurInconnu: boolean | undefined = !props.servicesRepasIntranets.find(sri => sri.IdService
                        === localisationActuelle?.Service?.Id)?.RepasIntranets.some(rep => rep.Id === dateRepas.Repas.Id);

                    const isMoficationPermise: boolean | undefined = !isValeurInconnu
                        && repasIsVerouillerIsModifiable.isModifiable
                        && DroitAbsence(utilisateur, conviveAbsence.Type, conviveAbsence.IsSuiviDietetique, false).IsDroitPermis;

                    const dateHeureRepasActuelle: Date = new Date(dateRepas.Date);
                    setTimeFromRepas(dateHeureRepasActuelle, dateRepas.Repas);

                    const isPreadmisSaisissable = localisationActuelle
                        && new Date(localisationActuelle.DateHeureDebut) > new Date()
                        ? new Date(localisationActuelle.DateHeureDebut) <= dateHeureRepasActuelle
                        : true;

                    detailsLignes[dateRepasKey] =
                    {
                        dataToDisplay: `${GetAbsenceDisplayText(abs)}${conviveAbsence.RepasPris.map(rep => rep.Designation)}`,
                        data:
                        {
                            absence: abs,
                            isModifiable: (isMoficationPermise ? isMoficationPermise : false) && dateRepas.Date >=
                                FormatDateToApiDate(new Date()) && isPreadmisSaisissable,
                            isVerrouiller: repasIsVerouillerIsModifiable.isVerrouiller,
                            isValeurInconnu: !isPreadmisSaisissable ? true : (isValeurInconnu ? isValeurInconnu : false),
                        },
                    };
                }
                else
                {
                    const abs: IAbsenceData = GetAbsence(
                        {
                            IdConvive: conviveAbsence.Id,
                            AbsencesDatees: [],
                            AbsencesHebdos: [],
                        }, dateRepas);

                    detailsLignes[dateRepasKey] =
                    {
                        dataToDisplay: "",
                        data:
                        {
                            absence: abs,
                            isModifiable: false,
                            isVerrouiller: false,
                            isValeurInconnu: true,
                        },
                    };
                }
            });
        }
        else
        {
            datesRepasAffichees.forEach(dateRepas =>
            {
                const dateRepasKey = GetKeyDateRepas(dateRepas);
                detailsLignes[dateRepasKey] =
                {
                    dataToDisplay: "",
                    data:
                    {
                        absence:
                        {
                            IsAbsent: false,
                            IsAbsentDepart: false,
                            IsAbsentHebdo: false,
                            IsPresent: false,
                        },
                        isModifiable: false,
                        isVerrouiller: false,
                        isValeurInconnu: true,
                    },
                };
            });
        }
        return detailsLignes;
    }, [GetAbsenceDisplayText, GetKeyDateRepas, datesRepasAffichees, props.horairesBlocageService.data, props.servicesRepasIntranets, props.verrousCommandeService.data, utilisateur]);

    /**
     *  function permettant d'obtenir la ligne affichée par la grille
     *  @param conviveAbsence un objet conviveabsence contenant les informations d'absences du convive pour les différentes date repas
     *  @param litDuConvive un objet lit regroupant les informations du lit
     *  @param convivesDansCeLitSansPreads listes des conviveAbsence qui sont dans ce lit sans les préadmissions
     *  @returns un objet ligne permettant l'affichage des données par la grille télérik
     */
    const getLigneGrille = useCallback((conviveAbsence: IConviveAbsences | undefined
        , litDuConvive: ILit | undefined, isSurbooking: boolean)
        : IConviveAbsencesLigne =>
    {
        let ligneGrille: IConviveAbsencesLigne =
        {
            convive: undefined,
            absences: getLigneGrilleDetails(undefined, undefined),
            localisationActuelle: undefined,
            litVueGenerale:
            {
                data:
                {
                    lit: litDuConvive,
                    IsSurbooking: false,
                },
                dataToDisplay: `${litDuConvive?.Chambre?.Designation ? litDuConvive.Chambre?.Designation : ""}
                ${litDuConvive?.Designation ? litDuConvive?.Designation : ""}`.trim(),
            },
            individuelOuGroupe: undefined,
        };

        if (conviveAbsence)
        {
            const localisationActuelle: ILocalisationPeriode | undefined
                = conviveAbsence?.Localisations?.findLast(loc => loc);

            ligneGrille =
            {
                convive: conviveAbsence,
                absences: getLigneGrilleDetails(conviveAbsence, localisationActuelle),
                localisationActuelle,
                litVueGenerale:
                {
                    data:
                    {
                        lit: localisationActuelle?.Lit,
                        IsSurbooking: isSurbooking,
                    },
                    dataToDisplay: `${localisationActuelle?.Lit?.Chambre?.Designation
                        ? localisationActuelle?.Lit?.Chambre?.Designation : ""} ${localisationActuelle?.Lit?.Designation
                            ? localisationActuelle?.Lit?.Designation : ""}`.trim(),
                },
                individuelOuGroupe: conviveAbsence.Type === TypeConvive.Patient ? traduction.Common.Convive
                    : (conviveAbsence.Type === TypeConvive.Groupe ? traduction.Common.Groupes : undefined),
            };
        }
        else
        {
            //on a déjà initialisé ce cas avant le if
        }
        return ligneGrille;
    }, [getLigneGrilleDetails, traduction.Common.Convive, traduction.Common.Groupes]);

    /**
     *   function permettant de construire la liste de données de la grille
     *   @returns une liste de ligne de type IConviveAbsencesRow
     */
    const absencesRows: IConviveAbsencesLigne[] = useMemo(() =>
    {
        const convivesLignes: IConviveAbsencesLigne[] = [];
        if (props.convivesAbsences?.data)
        {
            const litsDuService: ILit[] = getLitsDuService(props.serviceSelectionAsyncState?.SelectedItem);

            //Patient
            litsDuService.forEach(l =>
            {
                if (typeConviveRoute === undefined || typeConviveRoute === TypeConviveRoute.Convive)
                {
                    const convivesDansCeLit = props.convivesAbsences?.data?.filter(
                        ca => ca?.Localisations?.some(loc => loc.Lit?.Id === l.Id));
                    const convivesDansCeLitSansPreads = convivesDansCeLit?.filter(
                        c => c?.Localisations.some(loc => new Date(loc.DateHeureDebut)
                            <= new Date()));

                    if (!convivesDansCeLit || convivesDansCeLit.length === 0)
                    {
                        convivesLignes.push(getLigneGrille(undefined, l, false));
                    }
                    else
                    {
                        convivesDansCeLit.filter(
                            c => DroitAbsence(utilisateur, c.Type, c.IsSuiviDietetique, true).IsDroitPermis).forEach(
                                cf =>
                                {
                                    const isSurbooking: boolean = cf.Type !== TypeConvive.Accompagnant
                                        && convivesDansCeLitSansPreads?.filter(c => c.Type !== TypeConvive.Accompagnant) ?
                                        convivesDansCeLitSansPreads?.filter(c => c.Type !== TypeConvive.Accompagnant).length > 1 :
                                        false;

                                    convivesLignes.push(getLigneGrille(cf, l, isSurbooking));
                                });
                    }
                }
                else
                {
                    //on n'affiche que les groupes
                }
            });

            if (typeConviveRoute === undefined || typeConviveRoute === TypeConviveRoute.Convive)
            {
                //Patient en mutations
                props.convivesAbsences.data.filter(
                    c => (c.Type === TypeConvive.Patient || c.Type === TypeConvive.Accompagnant) && DroitAbsence(
                        utilisateur, c.Type, c.IsSuiviDietetique, true).IsDroitPermis).filter(ca => ca?.Localisations.findLast(
                            loc => new Date(loc.DateHeureDebut) <= new Date())?.Lit === null)
                    .forEach(caf =>
                    {
                        convivesLignes.push(getLigneGrille(caf, undefined, false));
                    });
            }
            else
            {
                //on n'affiche que les groupes
            }

            if (typeConviveRoute === undefined || typeConviveRoute === TypeConviveRoute.Groupe)
            {
                props.convivesAbsences.data.filter(ca => ca.Localisations.findLast(loc =>
                    new Date(loc.DateHeureDebut) <= new Date())?.Lit === null).filter(
                        c => c.Type === TypeConvive.Groupe && DroitAbsence(utilisateur, c.Type, c.IsSuiviDietetique, true)
                            .IsDroitPermis).forEach(caf =>
                            {
                                convivesLignes.push(getLigneGrille(caf, undefined, false));
                            });
            }
            else
            {
                //on n'affiche que les convives
            }
        }
        else
        {
            //les données de l'api doivent etre luees
        }
        return convivesLignes;
    }, [getLigneGrille, props.convivesAbsences.data, props.serviceSelectionAsyncState?.SelectedItem, typeConviveRoute, utilisateur]);

    const customCellLit = useCallback((hCellProps: HCustomGridCellProps<IConviveAbsencesLigne>): React.ReactNode =>
    {
        const dataItem: IConviveAbsencesLigne = hCellProps.dataItem.dataItem;
        if (!dataItem.litVueGenerale)
        {
            return <></>;
        }
        return (
            <td {...hCellProps.tdProps}>
                <Tooltip position="top" anchorElement="target">
                    {dataItem.litVueGenerale.data.IsSurbooking
                        && <HIcons type={HIconType.Warning} title={traduction.Common.PlusieursConvivesDansCeMemeLit} />}
                    {`${dataItem.litVueGenerale.dataToDisplay}`.trim()}
                    {dataItem.litVueGenerale.data.lit?.IsConcernePasserelle
                        && <HIcons type={HIconType.ConcernePasserelle} title={traduction.Common.ConcerneParLaPasserelle} />}
                </Tooltip>
            </td>
        );
    }, [traduction.Common.PlusieursConvivesDansCeMemeLit, traduction.Common.ConcerneParLaPasserelle]);

    /**
     * Fonction passée en paramètre de la grille interdisant certaines celulles. cette fonction va recevoir une ligne et colonne
     * et renvoyer un boolean indiquant si la sélection est interdite pour la cellule correspondante
     * @returns la fonction d'interdiction executée par HGrid
     */
    const interdictionSelectionCellule = useCallback((dataItem: IConviveAbsencesLigne, infoColonne: IColumnInformation): boolean =>
    {
        if (infoColonne.tag === undefined)
        {
            throw new Error(`interdictionSelectionCellule - oubli du tag dans l'une des colonnes de date repas`);
        }
        return !dataItem?.absences[GetKeyDateRepas(infoColonne.tag as IDateRepas)]?.data.isModifiable;
    }, [GetKeyDateRepas]);

    /**
     * Fonction permettant d'afficher une cellule absence de la grille
     * @param hCellProps les props de la cellue
     * @param dateRepas la date repas de la cellule
     * @returns le code react à afficher
     */
    const customCellAbsence = useCallback((hCellProps: HCustomGridCellProps<IConviveAbsencesLigne>, dateRepas: IDateRepas)
        : React.ReactNode =>
    {
        const dataItem: IConviveAbsencesLigne = hCellProps.dataItem.dataItem;
        const indicateurAbsenceOwnProps: IIndicateurAbsenceOwnProps =
        {
            absence: dataItem.absences[GetKeyDateRepas(dateRepas)]?.data.absence,
            isVerrouiller: dataItem.absences[GetKeyDateRepas(dateRepas)]?.data.isVerrouiller,
            isModifiable: dataItem.absences[GetKeyDateRepas(dateRepas)]?.data.isModifiable,
            isValeurInconnu: dataItem.absences[GetKeyDateRepas(dateRepas)]?.data.isValeurInconnu,
        };
        return (<td {...hCellProps.tdProps}><IndicateurAbsence {...indicateurAbsenceOwnProps} /></td>);
    }, [GetKeyDateRepas]);

    /**
     * Fonction permettant d'afficher un lien hypertext dans la cellule convive de la grille
     * @param hCellProps les props de la cellue
     * @returns le code react à afficher
     */
    const customCellConvive = useCallback((hCellProps: HCustomGridCellProps<IConviveAbsencesLigne>): React.ReactNode =>
    {
        const dataItem: IConviveAbsencesLigne = hCellProps.dataItem.dataItem;
        return (
            dataItem.convive
            &&
            <td {...hCellProps.tdProps}>
                <Link className='convive-link' to={RouteFicheConviveForId(GetTypeConviveRoute(dataItem.convive.Type)
                    , dataItem.convive.Id)}>
                    <Identite convive={dataItem.convive} localisationActuelle={dataItem.localisationActuelle} cacherAge cacherCivilite />
                </Link>
            </td>
            ||
            <td {...hCellProps.tdProps}></td>
        );
    }, []);

    /**
     * Fonction créant les colonnes date repas de la grille absence
     * @returns le code react à afficher
     */
    const getGridColumnsRepas = useCallback((): IGridColumnPropsExtended[] =>
    {
        const gridColumnsProps: IGridColumnPropsExtended[] = [];
        let nbJour = props.decalageDateDebut;
        while (nbJour <= props.decalageDateFin)
        {
            const date = new Date(props.currentDateString);
            date.setDate(date.getDate() + nbJour);
            const dateStr = FormatDateToApiDate(date);
            const columnDateProps: IGridColumnPropsExtended = {
                //width: "140px",
                field: FieldNonExistant,
                title: FormatDateAffichageHestia(dateStr),
                resizable: false,
                filterable: false, sortable: false, groupable: false,
                headerClassName: "group-header"
            };
            let oldDateRepas: Nullable<IDateRepas> = null;
            columnDateProps.subColumnsProps =
                props.repas.map(r =>
                {
                    const dateRepas: IDateRepas = { Date: dateStr, Repas: r };
                    const className: string = (dateRepas.Date !== oldDateRepas?.Date ? "first-col" : "");
                    oldDateRepas = dateRepas;
                    const colProps: IGridColumnPropsExtended = {
                        isHiddenInColumnConfigurator: true,
                        isMenuHidden: true,
                        width: props.repas.length < 2 ? "95px" : "60px", filterable: false, sortable: false, groupable: false,
                        field: `absences.${GetKeyDateRepas(dateRepas)}.dataToDisplay`,
                        cellSelectable: true,
                        title: traduction.TranslateAB(r.Designation, r.Designation2),
                        //cell: GetCustomCell<IConviveAbsencesLigne>(cellProps => customCellAbsence(cellProps, dateRepas)),
                        cells: { data: cellProps => customCellAbsence(cellProps, dateRepas) },
                        headerClassName: '',
                        tag: dateRepas,
                        className
                    };

                    return colProps;
                }
                );
            gridColumnsProps.push(columnDateProps);
            nbJour++;
        }
        return gridColumnsProps;
    }, [GetKeyDateRepas, customCellAbsence, props, traduction]);

    /**
     * Fonction créant le composant grille absence
     * @returns le code react à afficher
     */
    const columnsProps: IGridColumnPropsExtended[] = useMemo(() =>
    {
        return [
            {
                width: typeConviveRoute === TypeConviveRoute.Convive ? 80 : 0,
                field: "litVueGenerale.dataToDisplay",
                title: traduction.Common.Lit,
                //cell: GetCustomCell(customCellLit),
                cells: { data: customCellLit },
                locked: true,
                isHiddenInColumnConfigurator: true,
            },
            {
                width: 150,
                field: "convive.NomPrenom",
                title: typeConviveRoute === TypeConviveRoute.Convive ? traduction.Common.Convive : traduction.Common.Groupe,
                //cell: GetCustomCell(customCellConvive),
                cells: { data: customCellConvive },
                locked: true,
            },
            {   // Pour regroupement
                field: "individuelOuGroupe",
                title: traduction.Common.Type,
                width: "0",
                resizable: false,
                isMenuHidden: true,
                isHiddenInColumnConfigurator: true,
            },
            ...getGridColumnsRepas(),
        ];
    }, [customCellLit, customCellConvive, traduction, getGridColumnsRepas, typeConviveRoute]);

    return (
        <HGrid
            className="vue-absences-grid"
            selectable={{
                selectMode: "Cells",
                select: {},
                onSelect: (e) => console.log("eSelect", e) //onSelectedItemsChange,
            }}
            //onSelectedItemsChange={onSelectedItemsChange}
            keySelector={(d) => `lit${d.litVueGenerale?.data.lit?.Id ? d.litVueGenerale.data.lit.Id : "0"}
                convive${d.convive?.Id ? d.convive.Id : "0"}`
            }
            data={absencesRows}
            interdictionSelectionCellule={interdictionSelectionCellule}
            columnsProps={columnsProps}
            initialDataState={{
                group: [...new Set(absencesRows.filter(g => g.individuelOuGroupe !== undefined)
                    .map(g => g.individuelOuGroupe))].length > 1 ? [{ field: "individuelOuGroupe" }] : []
            }}
        />
    );
}