/*
 * Fichier permettant de définir des types globaux, utilisable sans besoin de faire un import
 */
export { };

declare global
{
    /**
     * Type généric Nullable: pour créer un type qui peut être aussi null
     */
    type Nullable<T> = T | null;

    /**
     * Type généric Undefable: pour créer un type qui peut être aussi undefined
     */
    type Undefable<T> = T | undefined;

    /**
     * Type généric Nundefable: pour créer un type qui peut être aussi null ou undefined
     */
    type Nundefable<T> = T | null | undefined;

    /**
     * Type JSXNElement: un élément JSX pouvant être NULL ou FALSE
     * React accepte parfaitement une valeur null ou FALSE : l'élément correspondant ne sera alors pas affiché
     */
    type JSXNElement = JSX.Element | null | false;

    /**
     * Surcharge de l'interface native Window de javascript afin d'y stocker le token XSRF et la langue
     * utilisé par notre modèle de base afin de passer ce dernier au headers de chaque requête API.
     * Exclusion des erreurs ESLint pour cette interface ne respectant pas la syntaxe reglementée I + NomInterface
     *
     * Voir {@link antiforgery}
     */
    interface Window { _xsrfToken: string | undefined, _langue: Langue } // eslint-disable-line @typescript-eslint/naming-convention

    /*
     * Définition de l'interface IDateTimeUtcString
     * Utiliser pour l'échange de DateTime avec l'API
     *
     * Permet un typage fort des DateTime au format string, en UTC
     * Basé sur l'article :
     * https://spin.atomicobject.com/2017/06/19/strongly-typed-date-string-typescript/
     *
     * Note : on n'utilise pas le "enum tagging" mais plutôt une interface "bidon"
     * pour que le compilateur détecte l'utilisation d'une IDateTimeUtcString
     * dans un contexte qu'il ne devrait pas.
     */
    interface IDateTimeUtcString { __internal_dummy_datetimeutcstring_flag: any }

    /*
     * Définition du type DateString
     * Utiliser pour l'échange de Date avec l'API
     *
     * Permet un typage fort des Date au format string
     * Basé sur l'article :
     * https://spin.atomicobject.com/2017/06/19/strongly-typed-date-string-typescript/
     * https://github.com/Microsoft/TypeScript/issues/28079
     */
    type DateString = string & DateStringType;
    enum DateStringType { __dateStringType = "" }

    /**
     * Type pour la convertion d'une Date vers DateString pour envoyer à l'API
     */
    type DateStringInput = string | number | Date;

    /*
     * Implémentation simple d'un dictionnaire
     * cf https://stackoverflow.com/a/45188213
     */
    interface IDictionary<T>
    {
        [key: string]: T;
    }

    type Dictionary<K extends string | number | symbol, V> = {
        [key in K]: V;
    };

    /*
     * Implémentation simple d'un dictionnaire
     * Il y a deux implémentations différentes avec des types de retour différents car dans certaines interractions (avec Telerik notamment)
     * le type gérant le Undefable n'est pas compatible
     * cf https://stackoverflow.com/a/45188213
     */
    interface IUndefableDictionary<T>
    {
        //On renvoie Undefable<T> pour exprimer le fait que si la clé ne correspond pas à une entrée on renvoie undefined
        [key: string]: Undefable<T>;
    }

    /**
     * Permet de vérifier qu'une propriété existe sur un type donné cf https://stackoverflow.com/a/50470026
     * @param name nom de la propriété à verifier
     * @returns le nom de la propriété
     * Remarque : ce code générera une erreur de compilation si la propriété name n'existe pas dans le type T
     */
    function nameof<T>(name: Extract<keyof T, string>): string
    {
        return name;
    }
}