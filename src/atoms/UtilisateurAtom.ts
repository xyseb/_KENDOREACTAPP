//import { atom } from 'jotai';
import { atomWithStorage/*, createJSONStorage*/ } from 'jotai/utils';

import { IUtilisateur } from '@/Models/Utilisateur/Utilisateur';

//export const userAtom = atom<Nullable<IUtilisateur>>(null);
//const storage = createJSONStorage<Nullable<IUtilisateur>>(() => localStorage);

/**
 * Constante par default du nom de clé de localstorage de l'utilisateur
 * @default
 */
export const storageUtilisateurKey = 'Utilisateur';

/**
 * Configuration de l'Atom de l'utilisateur connecté
 */
export const utilisateurAtom = atomWithStorage<Nullable<IUtilisateur>>(storageUtilisateurKey, null/*, storage*/);
utilisateurAtom.debugLabel = "UtilisateurAtom::utilisateurAtom";