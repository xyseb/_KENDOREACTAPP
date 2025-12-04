/* eslint-disable max-lines-per-function */
import
React, {
    Children, ReactElement, ReactNode, cloneElement, forwardRef, isValidElement, useCallback,
    useEffect, useMemo, useRef, useState
} from 'react';
import { useAtomValue } from 'jotai';
import { AggregateDescriptor, SortDescriptor, /*State,*/ process } from '@progress/kendo-data-query';
import { Button, ButtonHandle } from '@progress/kendo-react-buttons';
import
{
    SortSettings,
    //getGroupIds, //gh
    //setExpandedState //gh
    SelectDescriptor, GroupExpandDescriptor, //ngh
    DetailExpandDescriptor
} from '@progress/kendo-react-data-tools';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import
{
    Grid, //gh
    GridCell,
    GridCellProps,
    GridColumn, //gh
    GridColumnMenuFilter,
    GridColumnMenuGroup,
    GridColumnMenuProps,
    GridColumnMenuSort,
    GridColumnMenuWrapper,
    GridColumnProps,
    GridDataStateChangeEvent,
    //GridExpandChangeEvent,
    GridGroupExpandChangeEvent, //ngh
    GridDetailExpandChangeEvent, //ngh
    GridCustomCellProps, //ngh
    GridHeaderCellProps,
    GridHeaderSelectionChangeEvent,
    GridProps,
    GridSelectableSettings,
    GridSelectionChangeEvent,
    GridToolbar, //gh
    //getSelectedState, //gh
    isColumnMenuFilterActive,
} from '@progress/kendo-react-grid';
import { Checkbox, Input, InputChangeEvent, InputHandle } from '@progress/kendo-react-inputs';
import { GridPDFExport } from '@progress/kendo-react-pdf';
import { Popup } from '@progress/kendo-react-popup';
//import { chevronDoubleDownIcon, chevronDoubleRightIcon } from '@progress/kendo-svg-icons';
import
{
    fileExcelIcon,
    filePdfIcon,
    chevronDoubleDownIcon,
    chevronDoubleRightIcon,
    gearIcon,
    columnsIcon
} from '@progress/kendo-svg-icons';
import { GroupResult, State, groupBy } from '@progress/kendo-react-all'; //ngh
import { FaTools } from "react-icons/fa";
import { FaFilePdf, FaMagnifyingGlass } from "react-icons/fa6";
import { RiFileExcel2Fill } from "react-icons/ri";

import { traductionAtom } from '@/Atoms/TraductionAtom';
import { utilisateurAtom } from '@/Atoms/UtilisateurAtom';

import { NiveauMaxRecursion } from '@/Utils/Constants';
import { nameof } from '@/Utils/utils';

import { IUtilisateur } from '@/Models/Utilisateur/Utilisateur';
import { DroitTrierGrouperFilterRechercherHGrid } from '@/Models/Utilisateur/Droit';

import './HGridz.scss';

/**
 * Interface pour les données d'une cellule pour forcer à proposer une représentation sous forme de texte dans le
 * cas d'une cellule personnalisée. Ceci est important pour le bon fonctionnement, des filtres, groupements et exports
 */
export interface IGridCustomCellData<T>
{
    dataToDisplay: string;
    data: T;
}

/**
 * Interface étendue des props de colonne
 */
export interface IGridColumnPropsExtended extends GridColumnProps
{
    isHiddenInColumnConfigurator?: boolean;
    /*
     * Permet de cacher le menu en entête de colonne, on pourrait vouloir utiliser "filterable" qui existe déja mais
     * contrairement à ce qu'indique le commentaire de Telerik, cette propriété est à false par défaut ce qui n'est pas ce qu'on souhaite.
     */
    isMenuHidden?: boolean;
    /**
     * Utile dans le cas où on utilise des groupes de colonne : ici ce sont colonnes sous le groupe de colonne
     */
    subColumnsProps?: IGridColumnPropsExtended[];
    children?: never;
    sortField?: string;
    groupField?: string;
    /**
     * Permet de stocker des informations. Il faudra caster en sortie pour pouvoir utiliser l'information
     */
    tag?: unknown;
    /**
     *  Indique si les cellules de cette colonnes sont sélectionnables (susceptibles d'être renvoyées par "onSelectedItemsChange" de la grille lors d'une sélection de cellule par l'utilisateur)
     * Par défaut non sélectionnable
     */
    cellSelectable?: boolean;
    /**
     * Remarque : Telerik permet de ne pas saisir de field mais puisqu'on utilise ce champ dans GridHelper comme identifiant unique (pour gérer leur visibilité par exemple)
     * (en attendant d'avoir une propriété "UniqueName" par exemple comme c'est le cas côté WPF) on ne va pas permettre de donner un champ vide
     * Si ce champ n'est pas nécessaire, utiliser "FieldNonExistant", pour les groupes de colonnes la non unicité n'a pas d'importance
     */
    field: string;

    /**
     * Cette propriété est renseignée en interne par la grille pour retrouver un groupe de colonne à partir d'une de ses sous-colonnes
     * Elle sera écrasée par la grille donc il ne sert à rien de la remplir depuis une vue
     */
    parentColProps?: IGridColumnPropsExtended;

    /**
     * Cette propriété permet l'ajout de compsant a gauche dans les headerCell
     */
    headerCellExtraComponent?: JSX.Element;
}

/**
 * Champ inexistant pour la colonne Action par exemple
 */
export const FieldNonExistant: string = 'None';

/**
 * Classe représentant d'un item de Grid
 */
export class DataGridItem<T>
{
    isChecked: boolean;

    /**
     * Le nom de cette propriété doit être la même que pour les groupes item "IGroupItem" de la grille car visiblement c'est comme ça que fonctionne telerik
     * Attention, si vous souhaitez renommer cette propriété, il faudra gérer "manuellement" la valeur de cette propriété car "setExpandedState" qu'on utilise actuellement
     * ne met à jour que la propriété avec le nom "expanded"
     */
    expanded: boolean;
    /*
     * Selection : soit un boolean indiquant qu'une ligne est sélectionnée via la dataItemKey
     * ou un tableau d'index de colonne indiquant les cellules de la ligne qui sont sélectionnées
     * Remarque : cette propriété travaille sur un index qui peut varier en fonction de la présentation de la grille introduisant
     * des dysfonctionnements suivant que les colonnes de la grille soient groupées ou cachées
     * Privilégier l'utilisation de l'interface ISelectedColumnByFieldName plutôt
     */
    selected: boolean | number[] | undefined;

    dataItem: T;
    groupId?: string | number;
    dataItemKey: string | number;
    /**
     * Construit un item de Grid
     * @param dataItem TODO
     * @param keySelector TODO
     */
    constructor(dataItem: T, keySelector: (d: T) => string | number)
    {
        this.isChecked = false;
        this.expanded = false;
        this.selected = false;
        this.dataItem = dataItem;
        this.dataItemKey = keySelector(dataItem);
    }
}

/*
 *Information sur une sélection faite par l'utilisateur
 */
export interface ISelectedItem<T>
{
    selectedsColumnsInformations?: IColumnInformation[];
    dataItem: T;
}

/*
 *Information d'une colonne HGrid
 */
export interface IColumnInformation
{
    field?: string;
    tag: unknown;
}

const dataItemKey = `${nameof<DataGridItem<unknown>>("dataItemKey")}`;

/**
 * Le nom de cette propriété doit être la même que pour les groupes item "IGroupItem" de la grille car visiblement c'est comme ça que fonctionne telerik
 * Attention, si vous souhaitez renommer cette propriété, il faudra gérer "manuellement" la valeur de cette propriété car "setExpandedState" qu'on utilise actuellement
 * ne met à jour que la propriété avec le nom "expanded"
 */
const isExpandedField = nameof<DataGridItem<unknown>>("expanded");
const isSelectedField = nameof<DataGridItem<unknown>>("selected");

const TOOLBAR_BUTTON_TYPE = 'primary';
const fake_Field: string = 'non existant';

/**
 * Permet d'obtenir la valeur d'une propriété au chemin (fieldName) indiqué
 * @param fieldName : chemin de la propriété
 * @param dataItem : l'objet sur lequel on souhaite lire une propriété
 * @returns la valeur indiqée par le fieldName dans dataItem
 */
export function getNestedValue(fieldName: string | undefined, dataItem: any): any
{
    if (!fieldName)
    {
        return dataItem;
    }
    const propertyNames = fieldName.split('.');
    let data = dataItem;
    // On accède à la valeur de la propriété indiquée par fieldName
    propertyNames.forEach((property) =>
    {
        data = data ? data[property] : undefined;
    });

    return data;
}

/**
 * Wrapper autour d'une fonction utilitaire télérik afin de la commenter
 * Cette fonction retourne les lignes ou les cellules sélectionnées
 * @param event l'utilitaire a besoin de l'evenement de changement de sélection pour savoir ce qui a changé
 * @param selectedState on lui communique les cellules selectionnées avant les changements
 *  C'est une fonction pure, c'est à dire qui dépend que de ces arguments. Nous pensons que lors des multis-sélections
 * Il lui faut les lignes déjà sélectionnées pour continuer à les sélectionner
 * @returns le nouvel état contenant les lignes ou cellules sélectionnées
 */
function HGetSelectedState(event: GridSelectionChangeEvent, selectedState: IDictionary<boolean | number[]>)
    : IDictionary<boolean | number[]>
{
    return getSelectedState({
        event,
        selectedState,
        dataItemKey //Clef qui permet d'acceder au dictionnaire des sélections
    });
}

/**
 * Mise en surbrillance d'un texte dans le html des enfants d'un contrôle
 * @param children les éléments enfants d'un contrôle
 * @param searchText le texte à rechercher
 * @returns le noeud html
 */
function highlightSearchTextInReactChildren(children: HTMLCollection, searchText: string): ReactNode
{
    /**
     * Mise en surbrillance d'un texte donné dans un node
     * @param node le noeud dans lequel on souhaite appliquer la surbrillance
     * @returns le noeud react
     */
    function highlightInNode(node: React.ReactNode): ReactNode
    {
        if (typeof node === 'string')
        {
            // TODO : changer la couleur
            const modifiedContent = node.replace(
                new RegExp(`(${searchText})`, 'gi'),
                '<span style="background-color:#a8edb3">$1</span>'
            );
            if (node !== modifiedContent)
            {
                return <span dangerouslySetInnerHTML={{ __html: modifiedContent }} />;
            }
        }
        else if (isValidElement(node))
        {
            if (!node.props.children?.map)
            {
                return cloneElement(
                    node,
                    {},
                    highlightInNode(node.props.children)
                );
            }
            else
            {
                return cloneElement(
                    node,
                    {},
                    (node.props.children as React.ReactNode[])?.map((ch) => highlightInNode(ch))
                );
            }
        }

        return node;
    }
    const childrenAsJsx = (<>{children}</>);

    return Children.map(childrenAsJsx, (child: React.ReactNode) =>
    {
        return highlightInNode(child);
    });
}

/**
 * Nombre d'item (incluant les éléments regroupés)
 * @param data Les items
 * @returns le nombre d'items
 */
const getNumberOfItems = (data: any[], select: SelectDescriptor): number =>
{
    let count = 0;
    data.forEach((item) =>
    {
        // TODO : je pense que Telerik écrase la propriété "items" sur nos éléments de données pour y stocker les sous-données
        // C'est pas très beau, il faudrait sous doute créer des items visuels qui contiennent nos vrais items un peu
        // comme ce qu'on a fait pour le MultiSelectTree
        if (item.items)
        {
            if (item.expanded)
            {
                count = count + getNumberOfItems(item.items, select);
            }
        } else
        {
            count++;
        }
    });

    return count;
};

/**
 * Nombre d'items sélectionnés
 * @param data TODO description de data
 * @returns le nombre d'item selectionné

const getNumberOfSelectedItems = (data: any[]): number =>
{
    let count = 0;
    data.forEach((item) =>
    {
        if (item.items)
        {
            if (item.expanded)
            {
                count = count + getNumberOfSelectedItems(item.items);
            }
        }
        else
        {
            count = count + (item.selected === true ? 1 : 0);
        }
    });

    return count;
};*/

/**
 * Ce type est basé sur les observations au debugger et ce qui était fait initialement dans le code de GridHelper tel que fourni par Telerik
 * Il est possible qu'il y ai des adaptations à faire sur ces types si on constate que ça ne correspond pas à la réalité
 * Le but étatn principalement de clarifier le code pour éviter de tout gérer en any comme c'est fait dans le code fourni par Telerik
 * https://www.telerik.com/kendo-react-ui/components/grid/getting-started/gridhelper/
 */
interface IGroupItem<T>
{
    field: string;
    aggregates: AggregateDescriptor[] | object;
    value: unknown;
    groupId?: string;
    items: IGroupItem<T>[] | DataGridItem<T>[];
    /**
     * Le nom de cette propriété doit être la même que pour les items de la grille car visiblement c'est comme ça que fonctionne telerik
     * Attention, si vous souhaitez renommer cette propriété, il faudra gérer "manuellement" la valeur de cette propriété car "setExpandedState" qu'on utilise actuellement
     * ne met à jour que la propriété avec le nom "expanded"
     */
    expanded: boolean;
}

/**
 * Pour chaque groupe on crée une clé unique
 * @param data les informations sur les groupes (ou les items des groupes)
 */
const generateGroupIds = <T,>(data: IGroupItem<T>[] | DataGridItem<T>[]): void =>
{
    data.forEach((item) =>
    {
        if (Object.keys(item).filter(key => key === nameof<IGroupItem<T>>("aggregates")).length !== 0)
        {
            const groupItem = item as IGroupItem<T>;
            if (groupItem.aggregates)
            {
                groupItem.groupId = `${groupItem.field}_${groupItem.value}`;
                generateGroupIds(groupItem.items);
            }
        }
    });
};

const getDataColumnsTitles = (gridChildren) =>
{
    /*let*/const columns = {};
    gridChildren.forEach((child) =>
    {
        if (
            child.type.displayName === 'KendoReactGridColumn' &&
            child.props.field &&
            child.props.field !== 'selected'
        )
        {
            columns[child.props.title ?? child.props.field] = true;
        }
    });
    return columns;
};

/**
 * Menu en entête de colonne contenant plusieurs options
 * @param props TODO description de props + nom IGridColumnMenuOwnProps qui devrai aussi possiblement être ici
 * @returns l'element menu
 */
export const ColumnMenu = (props: Readonly<GridColumnMenuProps>): JSX.Element =>
{
    return (
        <div>
            <GridColumnMenuSort {...props} />
            <GridColumnMenuFilter {...props} />
            { /* TODO : j'ai l'impression qu'ils n'ont pas utilisés la traduction pour le texte de ce boutton et que le texte est en dur
             il faudra utiliser la méthode "render" pour surcharger le texte du coup :( */}
            <GridColumnMenuGroup {...props} />
        </div>
    );
};

/**
 * Ajout de la propriété "dataItem" dans le chemin vers la donnée pour gérer le fait qu'on encapsule les lignes dans des DataGridItem
 * pour typer fortement et les protéger des modifications "bourrins" de Telerik
 * @param pathToProperty chemin vers la donnée
 * @returns chemin corrigé vers la donnée
 */
export const gestionAjoutNiveauDataGridItem = <T extends string | undefined>(pathToProperty: T): T =>
{
    if (pathToProperty === undefined)
    {
        return pathToProperty; //undefined mais on veut garder le typage en T
    }
    else
    {
        return `${nameof<DataGridItem<unknown>>("dataItem")}.${pathToProperty}` as T;
    }
};

/**
 * Retrait de la propriété "dataItem" dans le chemin vers la donnée pour gérer le fait qu'on encapsule les lignes dans des DataGridItem
 * pour typer fortement et les protéger des modifications "bourrins" de Telerik
 * Dans certains cas on renvoi le field à la vue et il faut donc annuler cet ajout de "dataItem."
 * @param pathToProperty chemin vers la donnée
 * @returns chemin corrigé vers la donnée
 */
const gestionRetraitNiveauDataGridItem = <T extends string | undefined>(pathToProperty: T): T =>
{
    const prefixe: string = `${nameof<DataGridItem<unknown>>("dataItem")}.`;
    if (pathToProperty === undefined)
    {
        return pathToProperty;//undefined mais on veut garder le typage en T
    }
    else if (pathToProperty.startsWith(prefixe))
    {
        return pathToProperty.slice(prefixe.length) as T;
    }
    else
    {
        //Parait bizarre ?
        return pathToProperty;
    }
};

/**
 * Mise à plat des colonnes de la grille pour n'obtenir que les colonnes de dernier niveau
 * @param colonnesProps les props des colonnes (attention à ne pas passer .subColumnsProps qui ne contient pas les modifications faites par replaceGridColumns)
 * @returns les props des colonnes de dernier niveau (sans les niveaux introduit par les groupes de colonnes donc)
 */
const miseAPlatColonnes = (colonnesProps: IGridColumnPropsExtended[]): IGridColumnPropsExtended[] =>
{
    const fmiseAPlatColonne = (colsProps: IGridColumnPropsExtended[], niveauCourant: number): IGridColumnPropsExtended[] =>
    {
        if (niveauCourant > NiveauMaxRecursion)
        {
            throw new Error(`getColumnFieldNameByIndex - profondeur autorisée dépassée (controle de recursivité)`);
        }
        else
        {
            //niveau de recursivité correct
        }
        const newColProps: IGridColumnPropsExtended[] = [];
        colsProps.forEach(colProps =>
        {
            //On ne passe pas toujours par colProps.subColumnsProps car cette propriété ne contient pas les modifications faites via replaceGridColumns
            //notamment l'ajout du niveau "dataItem." dans le field. Le as unknown est nécessaire car sur IGridColumnPropsExtended on a mis le type children à never
            //pour indiquer aux vues de passer par la propriété subColumnsProps
            if (colProps.subColumnsProps)
            {
                let subColumnsProps: IGridColumnPropsExtended[];
                const colChildren = (colProps.children as unknown as ReactElement<IGridColumnPropsExtended>[] | null);
                if (colChildren)
                {
                    //On est déja passé par replaceGridColumn qui crée les vrais colonnes, on va travailler sur cette donnée
                    subColumnsProps = colChildren.map(c => c.props as IGridColumnPropsExtended);
                }
                else
                {
                    //on n'est pas encore passé dans replaceGridColumn qui crée les vrais colonnes on n'a donc rien dans children
                    subColumnsProps = colProps.subColumnsProps;
                }
                newColProps.push(...fmiseAPlatColonne(subColumnsProps, niveauCourant + 1));
            }
            else
            {
                //Pas de sous-colonnes
                newColProps.push(colProps);
            }
        });
        return newColProps;
    };
    const niveau: number = 0;
    return fmiseAPlatColonne(colonnesProps, niveau);
};

/**
 * Personnalisation de l'apparence des celulles d'entête de colonne (pour afficher un indicateur du tri sur une colonne avec propriété de tri différente de field par exemple)
 * source : https://www.telerik.com/forums/sort-icon-on-none-sort , https://stackblitz.com/edit/react-febfzz-wy1xku?file=app%2Fmain.jsx
 * @param headerCellProps les props de la celulle
 * @param columnsProps les props de toutes les colonnes (attention ces props sont transmsises avant l'ajout du "niveau" "dataItem. donc les field ne sont pas encore complets)
 * @param filterable boolean indiquant si les filtres sont activés au niveau de la grille
 * @param headerCellExtraComponent le composant optionnel supplémentaire d'un headerCell
 * @returns le rendu d'une cellule d'entête
 */
const customHeaderCell = (headerCellProps: GridHeaderCellProps, columnsProps: IGridColumnPropsExtended[], filterable: boolean, headerCellExtraComponent?: JSX.Element): JSX.Element =>
{
    //Au moment du rendu on a bien le niveau "dataItem."
    const currentField = headerCellProps.field;
    //mais pas dans les props de colonne passées donc on doit ajouter ce niveau pour la comparaison
    const colProps = miseAPlatColonnes(columnsProps).find(c => gestionAjoutNiveauDataGridItem(c.field) === currentField);
    const sortField = colProps?.sortField;
    //Cas ou la propriété de tri de la colonne correspondrait à une autre colonne (parait peu probable), on afficherait alors la flêche de tri sur la colonne en question
    const isTriAutreColonne = miseAPlatColonnes(columnsProps).some(c => c.field === sortField);
    //est-ce qu'il y a un tri appliqué sur cette propriété
    const sort = sortField
        ? headerCellProps.columnMenuWrapperProps.sort?.find(s => s.field === gestionAjoutNiveauDataGridItem(sortField))
        : undefined;

    const isMenuHidden = colProps?.isMenuHidden === true;
    //Si il y a un tri sur une propriété différente de field, Telerik n'affiche pas l'indicateur de tri donc on va l'afficher nous
    const showCustomSort = !isTriAutreColonne && sort !== undefined;
    return (
        <span className="k-cell-inner">
            {headerCellExtraComponent}
            <span className="k-link" role='presentation' onClick={headerCellProps.onClick}>
                <span className="k-column-title">
                    {headerCellProps.title}
                    {showCustomSort && (
                        <span className="k-sort-icon">
                            <span className={`k-icon k-i-sort-${sort.dir}-small`}></span>
                        </span>
                    )}
                    {headerCellProps.children}
                </span>
            </span>
            {
                filterable && !isMenuHidden &&
                <GridColumnMenuWrapper {...headerCellProps.columnMenuWrapperProps}></GridColumnMenuWrapper>
            }
        </span>
    );
};

/**
 * On parcourt les colonnes de la grille pour y remplacer le champ Field car on a ajouté un niveau dans la hierarchie des items de
 * la grille en passant par DataGridItem<T> pour avoir un typage fort des lignes de données de la grille
 * il faut donc que le champ "field" tienne compte de ce niveau
 * On en profite pour changer le type de colonne pour indiquer qu'on accepte "IGridColumnPropsExtended"
 * @param dataState description des opérations a faire sur les données tels que filtre , groupement...
 * @param columnsProps les props des colonnes de la grille
 * @param filterable Indique si la grille accepte les filtres
 * @returns les colonnes de la grille
 */
const replaceGridColumns = (dataState: State, columnsProps: IGridColumnPropsExtended[], filterable: boolean): React.ReactElement<IGridColumnPropsExtended>[] =>
{
    const colonnes = columnsProps.map((colProps, colPropsIndex) =>
    {
        const subColumnsProps = colProps.subColumnsProps;

        if (subColumnsProps)
        //enfant de colonne pour gérer des groupes de colonnes
        {
            const subChildren = subColumnsProps.map((subColProps, subColPropsIndex) =>
            {
                //on veut forcer pour que ce ne soit pas undefined
                const colField = gestionAjoutNiveauDataGridItem(subColProps.field);
                const sortField = gestionAjoutNiveauDataGridItem(subColProps.sortField);
                const groupField = gestionAjoutNiveauDataGridItem(subColProps.groupField);
                //On veut que la valeur par défaut soit false
                subColProps.cellSelectable = subColProps.cellSelectable ?? false;
                subColProps.parentColProps = colProps;//lien vers le groupe de colonne parent
                const newSubColProps = { ...subColProps, sortField, groupField };
                const isMenuHidden = subColProps?.isMenuHidden === true;
                if (subColProps.subColumnsProps && subColProps.subColumnsProps.length > 0)
                {
                    throw new Error("Actuellement la grille ne gère qu'un seul niveau de groupe de colonne");
                }

                return <GridColumn key={`${colPropsIndex}-${subColPropsIndex}`}
                    {...{
                        ...newSubColProps,
                        field: colField,
                        columnMenu: filterable && !isMenuHidden
                            ? ColumnMenu : undefined,
                        headerClassName: `${filterable && isColumnMenuFilterActive(colField, dataState.filter)
                            ? "active " : ""}${subColProps.headerClassName ?? ""}`,
                        //headerCell: (headerCellProps) => customHeaderCell(headerCellProps, columnsProps, filterable, subColProps.headerCellExtraComponent) // Voir si l'on garde customHeaderCell.
                    }} />;
            });

            return <GridColumn key={colPropsIndex}
                {...{
                    ...colProps,
                    children: subChildren,
                }} />;
        }
        else
        {
            const colField = gestionAjoutNiveauDataGridItem(colProps.field);
            const sortField = gestionAjoutNiveauDataGridItem(colProps.sortField);
            const groupField = gestionAjoutNiveauDataGridItem(colProps.groupField);
            //On veut que la valeur par défaut soit false
            colProps.cellSelectable = colProps.cellSelectable ?? false;
            const newColProps = { ...colProps, sortField, groupField };
            const isMenuHidden = colProps?.isMenuHidden === true;
            return <GridColumn key={colPropsIndex} {...{
                ...newColProps,
                field: colField,
                columnMenu: filterable && !isMenuHidden
                    ? ColumnMenu : undefined,
                headerClassName: `${filterable && isColumnMenuFilterActive(colField, dataState.filter)
                    ? "active " : ""}${colProps.headerClassName ?? ""}${" without-sub-column"}`,
                //headerCell: (headerCellProps) => customHeaderCell(headerCellProps, columnsProps, filterable, colProps.headerCellExtraComponent) // Voir si l'on garde customHeaderCell.
            }} />;
        }
    });
    //le cast direct ne fonctionne pas "as React.ReactElement<GridColumnProps>[]"
    return colonnes.map(c => c as React.ReactElement<IGridColumnPropsExtended>);
};

/**
 * Récupère la valeur de la propriété "field" de chaque GridColumn de la grille
 * (utilisé pour l'export excel)
 * @param columns les colonnes de la grille grille (y compris les enfants ".children")
 * @returns tableau des propriété "field" de chaque GridColumn
 */
const getGridFieldColumns = (columns: ReactElement<GridColumnProps>[]): GridColumnProps[] =>
{
    const fieldColumns: GridColumnProps[] = [];
    columns.forEach((column) =>
    {
        if (column.props.field !== 'selected')
        {
            fieldColumns.push(column.props);
        }
    });

    return fieldColumns;
};

/**
 * Interface des props/children du composant ExternalFilter
 */
interface IExternalFilterOwnProps
{
    filterValue: string | null; // TODO peut être null remplacer par undefined
    onChange: (event: InputChangeEvent) => void;
}

/**
 * Définition du composant pour la recherche dans toutes les cellules de la grille
 * @param props Les props react
 * @returns le composant de recherche sur cellules de la grille
 */
const ExternalFilter = forwardRef<InputHandle, Readonly<IExternalFilterOwnProps>>((props, ref): JSX.Element =>
{
    const traduction = useAtomValue(traductionAtom);

    return (
        <>
            <Input className="external-filter-input"
                value={props.filterValue ? props.filterValue : undefined}
                onChange={props.onChange}
                placeholder={`${traduction.Common.Rechercher} :`}
                ref={ref}
            />
            <FaMagnifyingGlass className="external-filter-input-loupe" />
        </>
    );
});

interface IExpandCollapseButtonOwnProps
{
    onGroupsToggle: () => void;
    collapse: boolean;
}

/**
 * Bouton permettant de tout déplier ou de tout replier (n'est pas utilisé pour le moment)
 * @param props Les props react
 * @returns bouton déplier/replier
 */
const ExpandCollapseButton = (props: Readonly<IExpandCollapseButtonOwnProps>): JSX.Element =>
{
    const traduction = useAtomValue(traductionAtom);

    return (
        <Button
            onClick={props.onGroupsToggle}
            themeColor={TOOLBAR_BUTTON_TYPE}
            size="small"
            title={!props.collapse ? traduction.Common.TelerikDevelopperGroupes : traduction.Common.TelerikReduireGroupes}
            svgIcon={props.collapse ? chevronDoubleDownIcon : chevronDoubleRightIcon}
        >
        </Button>
    );
};

interface IColumnsButtonOwnProps
{
    options: IDictionary<boolean>;
    columnsAPlatProps: IGridColumnPropsExtended[];
    onChange: (setting: string, checkBoxValue: boolean) => void;
}

interface IConfiguratorButtonBaseOwnProps extends IColumnsButtonOwnProps
{
    title: string;
    icon?: JSX.Element;
}

/**
 * Bouton avec popup qui montre toutes les propriétés d'un objet
 * Pour nous on va lui donner un dictionnaire contenant les field des colonnes ce qui permettra d'avoir notre popup
 * permettant d'afficher ou non une colonne donnée
 * props.options is the object with the properties that will be rendered in the checkbox list
 * props.icon is the name of the button icon
 * props.title sets the title of the button
 * props.onChange returns the toggled option/property
 * @param props Les props react
 * @returns Composant de visualisation des propriétés d'un objet
 */
const ConfiguratorButtonBase = (props: Readonly<IConfiguratorButtonBaseOwnProps>): JSX.Element =>
{
    const anchor = useRef(null);
    const [show, setShow] = useState(false);
    const buttonRef = useRef<ButtonHandle | null>(null);
    const popupDivRef = useRef<HTMLDivElement | null>(null);

    useEffect(() =>
    {
        const onMouseDown = (event: MouseEvent): void =>
        {
            if (event.target instanceof Element)
            {
                const clickedElement = event.target as Node;
                if (buttonRef.current?.element?.contains(clickedElement))
                {
                    // Clic sur le bouton, on ignore
                }
                else
                {
                    if (!popupDivRef.current?.contains(clickedElement))
                    {
                        setShow(false);
                    }
                    else
                    {
                        //on ne fait rien
                    }
                }
            }
            else
            {
                // Ne devrait pas se produire ? https://stackoverflow.com/a/28900856
                // Si ça se produit se sera en dehors de la popup donc il faut la fermer en tout cas
                setShow(false);
            }
        };

        window.addEventListener('mousedown', onMouseDown);
        return () => window.removeEventListener('mousedown', onMouseDown);
    }, [buttonRef]);

    /**
     * Gere le contenu de la Popup Afficher/Cacher les colonnes
     */
    const getPopupContent = useCallback((): ReactElement[] =>
    {
        let parentTitleOld: string = "";
        return (Object.entries(props.options).map(([key, value], index) =>
        {
            const isVisible = value;
            const colProps: IGridColumnPropsExtended = props.columnsAPlatProps.filter(c => c.field === key)[0];
            const parentTitle = colProps?.parentColProps?.title ?? "";

            if (colProps?.isHiddenInColumnConfigurator)
            {
                //On ignore cette colonne
                return <div key={index}></div>;
            }
            let parentdisplayed: ReactElement = <></>;
            if (parentTitle !== parentTitleOld)
            {
                parentdisplayed = <span className="parent-title" key={index}>{parentTitle}</span>;
            }

            parentTitleOld = parentTitle;
            // On trouve la colonne correspond à la clée et on affiche son titre (entête)
            return (
                <div key={index}>
                    {parentdisplayed}
                    <div className="column">
                        <div className="check-box">
                            <Checkbox
                                value={isVisible}
                                onChange={ev => props.onChange(key, ev.value)}
                                data-attr={key}
                            />
                        </div>
                        <span className="label">{colProps?.title ?? ""}</span>
                    </div>
                </div>
            );
        }));
    }, [props]);

    return (
        <div className="configurator-button-base">
            <span ref={anchor} title={props.title}>
                <Button className="toolbar-button" onClick={() => setShow(sh => !sh)} themeColor={TOOLBAR_BUTTON_TYPE} size="small" ref={buttonRef}>
                    {props.icon}
                </Button>
            </span>
            <Popup
                margin={{ vertical: 10, horizontal: 0 }}
                anchor={anchor.current}
                anchorAlign={{ vertical: 'bottom', horizontal: 'right' }}
                popupAlign={{ vertical: 'top', horizontal: 'right' }}
                show={show}
            >
                <div ref={popupDivRef} className="grid-helper-configurator-wrap-element">
                    <div className="popup-title">
                        {props.title}:
                    </div>
                    <div className="popup-content">
                        {getPopupContent()}
                    </div>
                </div>
            </Popup>
        </div>
    );
};

/**
 * Bouton pour afficher/cacher les colonnes
 * @param props Les props react
 * @returns Composant ConfiguratorButtonBase
 */
const ColumnsButton = (props: Readonly<IColumnsButtonOwnProps>): JSX.Element =>
{
    const traduction = useAtomValue(traductionAtom);

    return (
        <ConfiguratorButtonBase
            {...props}
            icon={<FaTools />}
            title={traduction.Common.TelerikAfficherCacherColonnes}
        />
    );
};

/*interface IGridCellPropsToIgnore
{
    // On va cacher cette fonction car il est important de l'appeler si on veut que la surbrillance dans la recherche fonctionne
    // On ne veut donc pas permettre de la surcharger car la technique est complexe et peu intuitive, on va le faire dans le code de GridHelper
    //render: never;
    // On va cacher cette propriété pour la remplacer par la notre qui n'aura pas le même type
    dataItem: never;
}

export type GridCellSimplifiedProps
    = Omit<GridCellProps, keyof IGridCellPropsToIgnore>;

export interface IHestiaGridCellProps<T> extends GridCellSimplifiedProps
{
    // Du point de vue de la grille on ne connait pas le type du vrai dataItem mais on sait qu'on manipule des "DataGridItem"
    // on écrase la propriété Telerik pour descendre d'un niveau et renvoyer le vrai dataitem plutôt qu'un "DataGridItem"
    dataItem: DataGridItem<T>;
}*/

/**
 * On va cacher cette propriété pour la remplacer par la notre qui sera fortement typée
 */
type StronglyTypeDataItemType<P, T> = Omit<P, 'dataItem'> & {
    dataItem: DataGridItem<T>;
};

/**
 * Type fort générique des cellules suivant le type de donnée traité par la grille
 * permet d'avoir le typage de nom donné sur le dataItem
 */
export type HCustomGridCellProps<T> = StronglyTypeDataItemType<GridCustomCellProps, T>;

/**
 * Permet de déterminer facilement si les props d'une cellule correspondent à une cellule de groupement
 * Nécessaire car Telerik semble mentir sur le type de ligne dans certain cas
 * @param cellProps les props de la cellule
 * @returns vrai ou faux
 */
function isGroupHeaderCell(cellProps: GridCellProps): boolean
{
    if (cellProps.rowType === "groupHeader")
    {
        return true;
    }
    else if (cellProps.dataItem[nameof<IGroupItem<unknown>>("aggregates")] !== undefined && cellProps.dataItem[nameof<IGroupItem<unknown>>("items")] !== undefined)
    {
        return true;
    }
    else
    {
        //Rien à faire, pas un groupHeader
    }
    return false;
}

/**
 * Cette fonction permet d'encapsuler la création d'une celulle de grille Telerik personnalisée car cette création est fourbe :
 * Telerik nous permet de remplacer intégralement le composant de cellule ce qui casse le fonctionnement existant et les styles
 * On va donc encapsuler cette création et permettre uniquement de remplacer le contenu d'une cellule
 * Il est donc important de toujours passer par cette fonction quand on utilise la propriété "cell" du type
 * On a le <td> de la cellule qui est remplacé par une <div>, ça casse un peu l'affichage, on va faire en sorte d'avoir le <td> puis la <div> encapsulé
 * @see {GridColumnProps}
 * @param cellContentRender Fonction pour définir l'apparence du contenu d'une cellule de grille
 * @returns
 * Définition d'une celulle de grille Telerik TODO verifier ce commentaire JSDoc pour le typage notament Readonly<OwnProps> qu'on fait avec les composants JSX.Element courants

export const GetCustomCell =
    <T,>(cellContentRender: (hCellProps: IHestiaGridCellProps<T>) => React.ReactNode) =>
        (cellProps: GridCellProps): JSX.Element =>
        {
            if (cellProps.rowType === "data" && !isGroupHeaderCell(cellProps))
            {
                // C'est une cellule classique (pas une cellule de groupement ou autre qui n'a pas la même structure pour un dataItem)
                // On recopie les propriétés de cellProps dans hestiaCellProps sauf "render"
                const { render, ...hestiaCellProps } = cellProps;
                // On retire le niveau "visuel" pour permettre de travailler directement sur l'item que la vue nous transmet
                hestiaCellProps.dataItem = (hestiaCellProps.dataItem as DataGridItem<T>).dataItem;
                // On récupère le contenu de notre cellule personnalisée
                const cellContent = cellContentRender(hestiaCellProps as IHestiaGridCellProps<T>);

                /**
                 * On sait que "GridCell" est la méthode pour créer un composant cellule par défaut
                 * (contient par défaut le texte dans la propriété "field" pour notre dataItem)
                 * Cette fonction va également appeler
                 * @see GridCellProps.render qui pour nous va notamment ajouter la surbrillance de la recherche
                 * ça ne sert à rien puisqu'on va ensuite remplacer le contenu de la celulle et qu'il faudra réappeler la méthode render
                 * On va donc la passer hestiaCellProps qui ne contient pas la propriété render pour sauter cette étape inutile
                 *z/
                const defaultGridCell = GridCell(hestiaCellProps);
                if (defaultGridCell)
                {
                    const gridCellWithCustomContent = cloneElement(defaultGridCell, defaultGridCell.props, cellContent);
                    //On fait un render car sinon ça ne marche pas sur la mise en surbrillance lors d'une recherche
                    return cellProps.render ? cellProps.render(gridCellWithCustomContent, cellProps) as JSX.Element : gridCellWithCustomContent;
                }
                else
                {
                    // La signature de GridCell indique qu'on pourrait avoir null mais je ne suis pas convaincu que ce soit
                    // vraiment possible. Peut être si field n'est pas renseigné ?
                    // On renvoi vide
                    return <></>;
                }
            }
            else
            {
                // Si on doit un jour personaliser une cellule de groupement on pourra le faire ici
                return GridCell(cellProps) as JSX.Element;
            }
        };*/

interface IToolbarSettings
{
    externalFilter: boolean; // C'est le champ de recherche dans tous les champs en haut
    expandCollapseAllButton: boolean;
    excelExportButton: boolean;
    pdfExportButton: boolean;
    showColumnsConfigurator: boolean;
    filterHighlights: boolean;
}

interface IPageable
{
    buttonCount: number;
    info: boolean;
    pageSizes: number[];
}

/**
 * On ne souhaite pas exporter cet enum mais on va avoir besoin des valeurs dans l'autocomplétion
 * Si vous modifier cette énum attention donc a ce que la props selectMode de HSelectable soit également à jour
 * Pas d'autre moyen semble il.
 */
enum HSelectMode
{
    Cell = "Cell",
    Cells = "Cells",
    Row = "Row",
    Rows = "Rows",
}

type HSelectable = {
    selectMode: "Cell" | "Cells" | "Row" | "Rows";
    onSelect: () => void;
    select: SelectDescriptor;
}

/*interface IHestiaGridSelectionProps
{
    selectable: Pick<GridProps, "selectable">,
    navigatable: Pick<GridProps, "navigatable">,
    select: Pick<GridProps, "select">,
    onSelectionChange: Pick<GridProps, "onSelectionChange">
}*/

/**
 * Interface des props/children du composant GridHelper
 */
interface IGridHelperOwnProps<T, K extends keyof T> extends Omit<GridProps, "dataItemKey" | "selectable" | "defaultSelect" | "navigatable" | "select" | "onSelectionChange">
{
    /**
     * Paramètrage de la toolbar qui n'est pas une GridProps mais nous permet de manager le besoin de la toolbar
     * - faire des regroupements sur une entête de colonnes
     *   - mise à dispotition de la zone droppable pour faire ce regroupement
     *   - mise à disposition d'un bouton pour l'aspect GridGroupExpandable
     * - disposé de la recherche externalFilter
     * - disposé des fonctionnalité d'export pdf ; excel ; csv
     * - disposé d'un menu de selection de fisibilité de colonne
     */
    toolbarSettings?: IToolbarSettings;
    /**
     * Props telerik de GridProps représentant un selecteur donnée correspondant à la ligne
     * On la surcharge pour la rendre obligatoir car peut être undefined mais l'usage est sur tellement de features de Grid
     * ATTENTION case sensitive. Bien mettre la casse tel que dans definit pour l'entité de data donné à la grille
     */
    dataItemKey: K

    initialDataState?: State;
    //onSelectedItemsChange?: (newSelectedItems: ISelectedItem<T>[]) => void;
    /**
     * Fonction passée en paramètre qui doit être implémenter dans le composant appellant. Elle permettra de savoir pour une cellule si sa sélection est interdite
     * @param dataItem : les données de la ligne de la grille
     * @param infoColonne : les informations sur la colonne (permet combiné à la ligne de déterminer la cellule)
     * @returns vrai ou false selon si la sélection de cette cellule est interdite
     */
    interdictionSelectionCellule?: (dataItem: T, infoColonne: IColumnInformation) => boolean;
    //onSelectionChange?: (item: any) => void; // TODO : voir le bon type de l'évènement
    filterable?: boolean;
    //isSelectionMultiple?: boolean;
    isToolbarPanelVisible?: boolean;
    //isSelectable?: boolean;
    selectable?: HSelectable;
    groupable?: boolean; //not sure
    sortable?: boolean;
    pageable?: IPageable;
    data: T[];
    children?: never;
    keySelector: (d: T) => string | number;
    className?: string;
    //isCellSelectionMode?: boolean;
    columnsProps: IGridColumnPropsExtended[];
    resizable?: boolean;
}

/**
 * Composant HGrid configurant et fournissant les features de la grille
 * On prend en paramètre une grille et on recopie ses propriétés dans une nouvelle grille autour de laquelle on
 * ajoute des boutons et diverses fonctionnalités (filtre, toolbarPanel, recherche avec surbrillance ...)
 * Cela permet de regrouper le travail sur les fonctionnalités de la grille plutôt que de le refaire à chaque fois
 *
 * Remarque : on va remplacer chaque item par un DataGridItem qui englobe le vrai item ce qui nous permet de typer
 * l'accès à certaines propriétés que Telerik ajoute à la volée sur les items de data passé en paramètre
 * En principe on essaye de n'exposer à l'extérieur que des vrais items plutôt que des DataGridItem mais quand on ajoute une fonctionnalité
 * il faut en être conscient
 * Exemple : je passe un tableau de IService à la propriété "data" de "IHGridOwnProps", le dataitem qui sera géré par Telerik sera un
 * DataGridItem avec un IService dans sa propriété "dataItem"
 * (cf "replaceGridColumns" où on modifie la propriété "field" des colonnes pour simplifier l'utilisation)
 * @param props les props
 * @returns le composant HGrid
 */
export default function HGridz<T, K extends keyof T>(props: Readonly<IGridHelperOwnProps<T, K>>): JSX.Element
//export const GridHelper = <T,>(props: Readonly<IGridHelperOwnProps<T>>): JSX.Element =>
{
    //STATES
    const utilisateur = useAtomValue(utilisateurAtom) as IUtilisateur; // Forcement connecté donc considéré non null via "as IUtilisateur"
    const traduction = useAtomValue(traductionAtom);

    // Est groupable par defaut si droit de trier grouper filter
    const isGroupable = props.groupable === undefined && props.isToolbarPanelVisible === undefined
        || props.groupable && props.isToolbarPanelVisible
        || props.groupable === undefined && props.isToolbarPanelVisible
        ? DroitTrierGrouperFilterRechercherHGrid(utilisateur)
        : false;
    // Est triable par default si droit de trier grouper filter
    const isSortable = (props.sortable === undefined || props.sortable) && DroitTrierGrouperFilterRechercherHGrid(utilisateur);
    // Est filtrable par defaut si droit de trier grouper filter
    const isFilterable = (props.filterable === undefined || props.filterable) && DroitTrierGrouperFilterRechercherHGrid(utilisateur);

    // On autorise le toolbar panel que si on peut grouper, trier ou filtrer et qu'on a les droits de le faire
    const isToolbarPanelVisible = (props.isToolbarPanelVisible !== false) && (isGroupable || isSortable || isFilterable);

    const toolbarSettings = useMemo<IToolbarSettings>(() => props.toolbarSettings ?? {
        filterHighlights: true,
        expandCollapseAllButton: false,
        pdfExportButton: true,
        excelExportButton: true,
        externalFilter: true,
        showColumnsConfigurator: true,
    }, [props.toolbarSettings]);

    const pageable = props.pageable;
    // isSelectable = props.isSelectable ?? true;
    /*const selectable: GridSelectableSettings = props.isSelectionMultiple ? { mode: 'multiple' } : { mode: 'single' };

    if (props.isCellSelectionMode)
    {
        selectable.enabled = true;
        selectable.cell = true;
        selectable.drag = true;
    }*/

    const [unfilteredData, setUnfilteredData] = useState<DataGridItem<T>[]>([]);
    const [data, setData] = useState(unfilteredData);
    const dataItemsSelection = useRef<T[] | { dataItem: T, colFields: string[] }[]>([]);

    const getColumnFieldByIndex = (index: number) => "ok";
    const handleSelectionChangez = (event: GridSelectionChangeEvent, onSelectCallback?: (selection: T[] | { dataItem: T, colFields: string[] }[]) => void): void =>
    {
        if (onSelectCallback !== undefined)
        {
            //selection courante
            const selectedDataItemKeys = Object.keys(event.select) as unknown as (keyof T)[];

            const newSelected = (event.dataItems as DataGridItem<T>[])
                .reduce((acc, currentDataGridItem) => // on reduit au type T pour ne pas tenir compte de la surcouche DataGridItem<T>
                {
                    if (currentDataGridItem.dataItem)
                    {
                        acc.push(currentDataGridItem.dataItem);
                    }
                    return acc;
                }, [] as T[])
                .reduce((acc, currentDataItem) => // On traite suivant tout mode de selection pour
                {
                    if (event.cell) // Sélection par cellule(s)
                    {
                        if (props.selectable?.selectMode === HSelectMode.Cell) // mode single cell
                        {
                            const colIndex = (event.select[String(currentDataItem[props.dataItemKey])] as number[] | undefined)?.[0];
                            const colField = colIndex !== undefined ? getColumnFieldByIndex(colIndex) : undefined;

                            if (colField)
                            {
                                // Sélection single → une seule cellule
                                return [{ dataItem: currentDataItem, colFields: [colField] }];
                            }

                            return acc;
                        }
                        else // mode multiple cells
                        {
                            const currentKey = String(currentDataItem[props.dataItemKey]);
                            const selectedColIndexes = event.select[currentKey] as number[] | undefined;
                            const selectedColFields = selectedColIndexes?.map(getColumnFieldByIndex) ?? [];

                            const existing = (acc as { dataItem: T; colFields: string[] }[])
                                .find(item => item.dataItem[props.dataItemKey] === currentDataItem[props.dataItemKey]);

                            if (existing)
                            {
                                // Nettoyage des colonnes désélectionnées
                                const remainingCols = existing.colFields.filter(cf => !selectedColFields.includes(cf));
                                const mergedCols = Array.from(new Set([...remainingCols, ...selectedColFields]));

                                if (mergedCols.length === 0)
                                {
                                    // Retire totalement la ligne si aucune cellule sélectionnée
                                    return (acc as { dataItem: T; colFields: string[] }[])
                                        .filter(obj => obj.dataItem[props.dataItemKey] !== currentDataItem[props.dataItemKey]);
                                }

                                // Met à jour les colonnes sélectionnées
                                return (acc as { dataItem: T; colFields: string[] }[])
                                    .map(obj =>
                                        obj.dataItem[props.dataItemKey] === currentDataItem[props.dataItemKey]
                                            ? { dataItem: currentDataItem, colFields: mergedCols }
                                            : obj
                                    );
                            }
                            else if (selectedColFields.length > 0)
                            {
                                // Nouvelle ligne sélectionnée
                                return [
                                    ...(acc as { dataItem: T; colFields: string[] }[]),
                                    { dataItem: currentDataItem, colFields: selectedColFields }
                                ];
                            }
                        }
                    }
                    else // Sélection par ligne(s)
                    {
                        if (props.selectable?.selectMode === HSelectMode.Row) // single row
                        {
                            // Remplace toute la sélection par une seule ligne
                            return [currentDataItem];
                        }
                        else // multiple rows
                        {
                            const exists = (acc as T[]).some(
                                item => item[props.dataItemKey] === currentDataItem[props.dataItemKey]
                            );

                            if (exists)
                            {
                                // Toggle : retire si déjà sélectionnée
                                return (acc as T[]).filter(
                                    item => item[props.dataItemKey] !== currentDataItem[props.dataItemKey]
                                );
                            }
                            else if (selectedDataItemKeys.includes(currentDataItem[props.dataItemKey] as keyof T))
                            {
                                // Ajoute la nouvelle sélection
                                return [...(acc as T[]), currentDataItem];
                            }
                        }
                    }

                    return acc;
                }, event.cell ? [] as { dataItem: T, colFields: string[] }[] : [] as T[]);

            /*/ copie de ma ref qui contient les selections actuelement retenues
            const newSelected = dataItemsSelection.current;

            // Ici je veux traiter suivant le mode cell ou row pour avoir un T[] en cas de selection de row et sinon un { dataItem: T, colFields: string[] }[]
            // ou colFields contiendra la liste des fields de colonne selectionné
            const selectedDataItems = selectableDataItems.reduce((acc, currentDataItem) =>
            {
                if (event.cell) // Si mode de selection par cellule(s)
                {
                    if (props.selectable?.selectMode === HSelectMode.Cell) // Si mode single
                    {
                        //newSelected.fill({ dataItem: currentDataItem as T, colFields: [getColumnFieldByIndex((event.select[String(props.dataItemKey)] as number[])[0])] as string[] });
                        const cellSelection = newSelected as { dataItem: T, colFields: string[] }[];
                        const colIndex = (event.select[String(props.dataItemKey)] as number[])[0];
                        const colField = getColumnFieldByIndex(colIndex);

                        cellSelection.length = 0; // équivalent à .fill() mais sûr typiquement
                        cellSelection.push({ dataItem: currentDataItem, colFields: [colField] });
                    }
                    else // Sinon mode multiple cells
                    {
                        //if (currentDataItem[props.dataItemKey] in selectedDataItemKeys) // Si la dataItemKey de ligne est dans la sélection courante
                        // 🧩 Correction #2 — on convertit explicitement la clé pour éviter l’erreur "in"
                        const currentKey = currentDataItem[props.dataItemKey];
                        const currentKeyStr = String(currentKey) as keyof T;

                        if (selectedDataItemKeys.includes(currentKeyStr))
                        {
                            const alreadySelectedItem = (newSelected as { dataItem: T, colFields: string[] }[])
                                .find(obj => obj.dataItem[props.dataItemKey] === currentDataItem[props.dataItemKey]);

                            // Liste des colonnes sélectionnées pour cette ligne
                            const selectedColIndexes = event.select[String(currentDataItem[props.dataItemKey])] as number[];
                            const selectedColFields = selectedColIndexes.map(getColumnFieldByIndex);

                            if (alreadySelectedItem)
                            {
                                // Si des cellules étaient déjà sélectionnées, on vérifie les collisions
                                const remainingColFields = alreadySelectedItem.colFields.filter(
                                    cf => !selectedColFields.includes(cf)
                                );

                                // Si une cellule déjà sélectionnée est re-cliquée -> on la supprime (désélection)
                                if (remainingColFields.length < alreadySelectedItem.colFields.length)
                                {
                                    alreadySelectedItem.colFields = remainingColFields;
                                }

                                // Ajout des nouvelles colonnes si elles ne sont pas déjà présentes
                                selectedColFields.forEach(colField =>
                                {
                                    if (!alreadySelectedItem.colFields.includes(colField))
                                    {
                                        alreadySelectedItem.colFields.push(colField);
                                    }
                                });

                                // Si plus aucune cellule sélectionnée dans cette ligne -> on la retire de la sélection
                                if (alreadySelectedItem.colFields.length === 0)
                                {
                                    const idx = (newSelected as { dataItem: T, colFields: string[] }[]).indexOf(alreadySelectedItem);
                                    (newSelected as { dataItem: T, colFields: string[] }[]).splice(idx, 1);
                                }
                            }
                            else
                            {
                                // Nouvel élément sélectionné (nouvelle ligne)
                                (newSelected as { dataItem: T, colFields: string[] }[]).push({
                                    dataItem: currentDataItem,
                                    colFields: selectedColFields
                                });
                            }
                        }
                    }
                }
                else // Sinon c'est une selection par ligne(s)
                {
                    if (props.selectable?.selectMode === HSelectMode.Row) // Si mode single
                    {
                        //newSelected.fill(currentDataItem as T);
                        const rowSelection = newSelected as T[];
                        rowSelection.length = 0; // équivalent à .fill(), mais valide pour un T[]
                        rowSelection.push(currentDataItem);
                    }
                    else // Sinon mode multiple row
                    {
                        const existingIndex = (newSelected as T[])
                            .findIndex(sel => sel[props.dataItemKey] === currentDataItem[props.dataItemKey]);

                        if (existingIndex >= 0)
                        {
                            // Si la ligne est déjà sélectionnée -> on la retire (désélection)
                            (newSelected as T[]).splice(existingIndex, 1);
                        }
                        else if (selectedDataItemKeys.includes(currentDataItem[props.dataItemKey] as keyof T))
                        {
                            // Sinon -> on ajoute la nouvelle sélection
                            (newSelected as T[]).push(currentDataItem);
                        }
                    }
                }

                return acc;
            }, event.cell ? [] as { dataItem: T, colField: string[] }[] : [] as T[]);*/

            // On réassigne la ref de sélection
            dataItemsSelection.current = newSelected;
            // On donne ça à la fonction du composant parent de la grille qui est en charge de traiter la donnée de selection
            onSelectCallback(dataItemsSelection.current);
        }
        else
        {
            // Ne fait rien
        }
    };
    const handleSelectionChange = (
        event: GridSelectionChangeEvent,
        onSelectCallback?: (selection: T[] | { dataItem: T, colFields: string[] }[]) => void
    ): void =>
    {
        if (onSelectCallback !== undefined)
        {
            // Source de vérité des clés sélectionnées
            const selectedDataItemKeys = Object.keys(event.select) as unknown as (keyof T)[];

            // On part de la sélection précédente
            const previousSelection = dataItemsSelection.current;

            const newSelection = (event.dataItems as DataGridItem<T>[]) // Étape 1 : réduction pour obtenir les dataItems purs
                .reduce((acc, currentDataGridItem) =>
                {
                    if (currentDataGridItem.dataItem)
                    {
                        acc.push(currentDataGridItem.dataItem);
                    }
                    return acc;
                }, [] as T[])
                .reduce((acc, currentDataItem) => // Étape 2 : construction de la nouvelle sélection complète
                {
                    if (event.cell) // === Sélection par cellule(s) ===
                    {
                        if (props.selectable?.selectMode === HSelectMode.Cell) // === mode single cell ===
                        {
                            const colIndex = (event.select[String(currentDataItem[props.dataItemKey])] as number[] | undefined)?.[0];
                            const colField = colIndex !== undefined ? getColumnFieldByIndex(colIndex) : undefined;

                            if (colField)
                            {
                                // Une seule cellule active → unique item
                                return [{ dataItem: currentDataItem, colFields: [colField] }];
                            }
                            return acc;
                        }
                        else // === mode multiple cells ===
                        {
                            const currentKey = String(currentDataItem[props.dataItemKey]);
                            const selectedColIndexes = event.select[currentKey] as number[] | undefined;
                            const selectedColFields = selectedColIndexes?.map(getColumnFieldByIndex) ?? [];

                            // On regarde si ce dataItem était déjà sélectionné auparavant
                            const existing = (previousSelection as { dataItem: T; colFields: string[] }[])
                                .find(sel => sel.dataItem[props.dataItemKey] === currentDataItem[props.dataItemKey]);

                            if (selectedColFields.length === 0)
                            {
                                // Si aucune cellule sélectionnée pour cette ligne → suppression
                                return (acc as { dataItem: T; colFields: string[] }[])
                                    .filter(obj => obj.dataItem[props.dataItemKey] !== currentDataItem[props.dataItemKey]);
                            }

                            const mergedColFields = Array.from(
                                new Set([
                                    ...(existing?.colFields ?? []),
                                    ...selectedColFields
                                ])
                            );

                            // Met à jour ou ajoute la ligne dans la sélection
                            const updated = (acc as { dataItem: T; colFields: string[] }[])
                                .filter(obj => obj.dataItem[props.dataItemKey] !== currentDataItem[props.dataItemKey]);

                            updated.push({ dataItem: currentDataItem, colFields: mergedColFields });
                            return updated;
                        }
                    }
                    else // === Sélection par ligne(s) ===
                    {
                        if (props.selectable?.selectMode === HSelectMode.Row) // === mode single row ===
                        {
                            // Une seule ligne active → remplace toute la sélection
                            return [currentDataItem];
                        }
                        else // === mode multiple rows ===
                        {
                            const isSelected = selectedDataItemKeys.some(
                                key => currentDataItem[props.dataItemKey] === key
                            );

                            const alreadySelected = (previousSelection as T[]).some(
                                item => item[props.dataItemKey] === currentDataItem[props.dataItemKey]
                            );

                            if (isSelected && !alreadySelected)
                            {
                                // Ajout nouveau
                                return [...(acc as T[]), currentDataItem];
                            }
                            else if (!isSelected && alreadySelected)
                            {
                                // Retrait
                                return (acc as T[]).filter(
                                    item => item[props.dataItemKey] !== currentDataItem[props.dataItemKey]
                                );
                            }
                        }
                    }

                    return acc;
                }, event.cell ? [] as { dataItem: T, colFields: string[] }[] : [] as T[]);

            // Mise à jour de la ref et callback
            dataItemsSelection.current = newSelection;
            onSelectCallback(newSelection);
        }
        else
        {
            // Ne fait rien
        }
    };

    let selectionGridProps: Pick<GridProps, "selectable" | "defaultSelect" | "navigatable" | "select" | "onSelectionChange">; //IHestiaGridSelectionProps;
    switch (props.selectable?.selectMode)
    {
        case HSelectMode.Cell:
            selectionGridProps = {
                selectable: { enabled: true, cell: true, mode: 'single', drag: false },
                navigatable: true, select: props.selectable.select, onSelectionChange: (ev) => handleSelectionChange(ev, props.selectable?.onSelect)
            };
            break;
        case HSelectMode.Cells:
            selectionGridProps = {
                selectable: { enabled: true, cell: true, mode: 'multiple', drag: true },
                navigatable: true, select: props.selectable.select, onSelectionChange: (ev) => handleSelectionChange(ev, props.selectable?.onSelect)
            };
            break;
        case HSelectMode.Row:
            selectionGridProps = {
                selectable: { enabled: true, cell: false, mode: 'single', drag: false },
                navigatable: true, select: props.selectable.select, onSelectionChange: (ev) => handleSelectionChange(ev, props.selectable?.onSelect)
            };
            break;
        case HSelectMode.Rows:
            selectionGridProps = {
                selectable: { enabled: true, cell: true, mode: 'multiple', drag: true },
                navigatable: true, select: props.selectable.select, onSelectionChange: (ev) => handleSelectionChange(ev, props.selectable?.onSelect)
            };
            break;
        default:
            selectionGridProps = { selectable: undefined, navigatable: undefined, select: undefined, onSelectionChange: undefined };
    }

    // On permet uniquement de ne pas autoriser le tri, sinon on impose les options car je ne vois pas l'intérêt de personnaliser par écran
    // et pour cohérence avec le C#
    const sortable: SortSettings | undefined = props.sortable && { allowUnsort: true, mode: 'multiple' };

    /*State provenant HGrid permettant d'avoir une description des opérations a faire sur les données tels que filtre
     * , groupement...
     */
    const [dataState, setDataState] = useState<State>({
        ...props.initialDataState,
        // skip: 0,
        // take: 10,
        sort: props.initialDataState?.sort?.map(s => ({ ...s, field: gestionAjoutNiveauDataGridItem(s.field) })),
        group: props.initialDataState?.group?.map(g => ({ ...g, field: gestionAjoutNiveauDataGridItem(g.field) })),
    } ?? { skip: null });

    const columns = useMemo<ReactElement<IGridColumnPropsExtended>[]>(() => replaceGridColumns(dataState, props.columnsProps, isFilterable)
        , [dataState, props.columnsProps, isFilterable]);

    const refInputExternalFilter = useRef<InputHandle>(null);
    const [filterValue, setFilterValue] = useState<string | null>(null);// TODO peut être null remplacer par undefined
    useEffect(() =>
    {
        // Pour conserver le curseur sur le champ de saisie de la recherche
        refInputExternalFilter.current?.element?.focus();
    }, [filterValue]);

    const [exportColumns] = useState<GridColumnProps[]>(getGridFieldColumns(columns));

    useEffect(() =>
    {
        const dataGridItems = props.data.map(d => new DataGridItem(d, props.keySelector));
        setUnfilteredData(dataGridItems);
        setData(dataGridItems);
    }, [props.data, props.keySelector]);

    /**
     * Les props de colonnes de dernier niveau
     */
    const colPropsAPlat = useMemo<IGridColumnPropsExtended[]>(() =>
    {
        return miseAPlatColonnes(columns.map(c => c.props));
    }, [columns]);

    /**
     * Callback de renvoi un objet ayant comme propriété le nom des colonnes ou le nom des fields des colonnes
     * TODO : ajouter une propriété uniqueName comme côté WPF ? Servira également pour les personnalisations
     * cf https://stackoverflow.com/a/75737717 pour les types
     * @param callback Callback recevant les paramètres de la grille (y compris les enfants ".children") et retournant le dictionaire noms de colonnes/noms de champs
     * @param deps dépendance de useCallback
     * @returns version memoized du callback
     */
    const initColumnsVisibility = useCallback((colonnesPropsAPlat: IGridColumnPropsExtended[]): IDictionary<boolean> =>
    {
        const columnsVisibilityDictionary: IDictionary<boolean> = {};
        const colsFields: string[] = [];
        colonnesPropsAPlat.forEach((colProps) =>
        {
            if (colProps.field !== gestionAjoutNiveauDataGridItem(FieldNonExistant) && colsFields.some(cF => cF === colProps.field))
            {
                //On a déja rencontré ce field, les field des colonnes doivent être uniques
                throw new Error(`initColumnsVisibility - le field ${colProps.field} est en double ce qui n'est pas autorisé`);
            }
            else
            {
                colsFields.push(colProps.field);
            }
            if (colProps.field !== 'selected')//TODO BR : à quoi ça sert déja ? Est-ce que c'est pour gérer une colonne avec une checkbox de sélection dans l'entête ?
            {
                // TODO : imposer un identifiant/nom unique plutôt que d'utiliser title et field ? Cela servira pour les personnalisations
                columnsVisibilityDictionary[colProps.field] = true;
            }
            else
            {
                columnsVisibilityDictionary[colProps.field] = false;
            }
        });

        return columnsVisibilityDictionary;
    }, []);

    const [columnsVisibility, setColumnsVisibility] = useState<IDictionary<boolean>>({});
    const [columnsState, setColumnsState] = useState(getDataColumnsTitles(/*GridProps.children*/columns));
    useEffect(() =>
    {
        setColumnsVisibility(initColumnsVisibility(colPropsAPlat));
    }, [setColumnsVisibility, initColumnsVisibility, colPropsAPlat]);

    /*
     * Selection : soit un boolean indiquant qu'une ligne est sélectionnée via la dataItemKey
     * ou un tableau d'index de colonne indiquant les cellules de la ligne qui sont sélectionnées
     */
    //const [selectedState, setSelectedState] = useState<IDictionary<boolean | number[]>>({});
    const [select, setSelect] = useState<SelectDescriptor>();
    //const [collapsedState, setCollapsedState] = useState<string[]>([]);
    const [collapsedGroup, setCollapsedGroup] = useState<GroupExpandDescriptor[]>([]);
    const [total, setTotal] = useState(data.length);

    /**
     * Callback de màj de la visibilité des colonnes
     * @param callback Callback recevant TODO et retournant void (Màj du state columnsVisibility)
     * @param deps dépendance de useCallback
     * @returns version memoized du callback
     */
    const updateColumns = useCallback((setting: string, state: boolean): void =>
    {
        setColumnsVisibility(colVis =>
        {
            const newColumnsVisibility = { ...colVis };
            newColumnsVisibility[setting] = state;
            return newColumnsVisibility;
        });
    }, [setColumnsVisibility]);

    /**
     * Fonction au changement de la donnée de la grille
     * Màj du state dataState
     * @param ev l'évenement onDataStateChange de la grille
     */
    const onDataStateChange = useCallback((ev: GridDataStateChangeEvent): void =>
    {
        const sorts = ev.dataState.sort;
        let sortsNew: Undefable<SortDescriptor[]> = undefined;
        if (sorts)
        {
            //copie complête
            sortsNew = [...sorts.map(s => ({ ...s }))];
            sorts.forEach(sort =>
            {
                const col = columns.find(c => c.props.field === sort.field);
                if (col)
                {
                    const colProps = col.props;
                    if (colProps.sortField)
                    {
                        const actuel = sortsNew?.find(s => s.field === colProps.sortField);
                        if (actuel)
                        {// Il existe déjà un tri sur sortField
                            // on inverse le tri
                            actuel.dir = (actuel.dir === 'asc') ? 'desc' : undefined;
                            // on ignore l'ajout du tri (en le supprimant dans sortsNew)
                            sortsNew = sortsNew?.filter(s => s.field !== sort.field);
                        }
                        else
                        {// Il n'y a pas encore de tri du sortField
                            // On modifie la demande de tri pour trier sur sortField (en non pas sur field)
                            const newSort = sortsNew?.find(s => s.field === sort.field);
                            newSort!.field = colProps.sortField;
                        }
                    }
                    else
                    {
                        //Pas de field de tri personnalisé
                    }
                }
                else
                {
                    //Colonne non trouvée, certainement qu'on a déja remplacé
                }
            });
        }

        // On supprime les filtre sans direction (correspond au troisième état asc/desc/undefined)
        sortsNew = sortsNew?.filter(s => s.dir !== undefined);

        const groups = ev.dataState.group;
        if (groups)
        {
            groups.forEach(group =>
            {
                const col = columns.find(c => c.props.field === group.field);
                if (col)
                {
                    const colProps = col.props;
                    if (colProps.groupField)
                    {
                        group.field = colProps.groupField;
                    }
                    else
                    {
                        //Pas de field de groupement personnalisé
                    }
                }
                else
                {
                    //Colonne non trouvée, sans doute parce qu'on a déja remplacé
                }
            });
        }
        setDataState({ ...ev.dataState, sort: sortsNew });
    }, [columns]);

    /**
     * Callback de la fonction sur l'évenement onExpandeChange de la grille
     * Pour le moment on ne se sert pas de cette fonction, le fait de la laisser non assignée permet de ne pas
     * faire apparaitre la colonne de bouton permettant de déplier/replier un détail de ligne
     * @param callback Le callback avec en propriété l'evenement GridExpandChangeEvent qui retourne void (Màj du state collapsedState)
     * @param deps dépendance de useCallback
     * @returns version memoized du callback

    const onExpandChange = useCallback(
        (event: GridExpandChangeEvent): void =>
        {
            const item = event.dataItem;
            if (item.groupId)
            {
                const newCollapsedIds = !event.value
                    ? [...collapsedState, item.groupId]
                    : collapsedState.filter((groupId) => groupId !== item.groupId);
                setCollapsedState(newCollapsedIds);
            }
        },
        [collapsedState]
    );*/
    const onGroupExpandChange = useCallback((event: GridGroupExpandChangeEvent) =>
    {
        setCollapsedGroup(event.groupExpand);
    }, []);

    /**
     * Callback de la fonction sur l'évenement onSelectionChange de la grille
     * @param callback Le callback avec en propriété l'evenement GridSelectionChangeEvent qui retourne void (Màj du state selectedState)
     * @param deps dépendance de useCallback
     * @returns version memoized du callback
     */
    /*const onSelectionChange = useCallback(
        (event: GridSelectionChangeEvent) =>
        {
            const pointerEvent = event.nativeEvent as PointerEvent;
            let node = pointerEvent.target as Node | null;
            while (node !== null && node !== undefined && !(node as Element | null)?.classList.contains('k-grid'))
            {
                node = node.parentElement;
            }

            if ((node?.parentElement as Element | null)?.classList.contains('k-detail-cell'))
            {
                //On ignore le changement de sélection, il s'agit d'un clic dans une cellule à l'intérieur d'un détail de grille
                return;
            }

            /*const newSelectedState = HGetSelectedState(event, selectedState);

            setSelectedState(newSelectedState);*z/

            if (props.onSelectionChange)
            //Props de la grille appelante
            {
                props.onSelectionChange(event);
            }

            /*if (props.onSelectedItemsChange)
            {
                const dataGridItems: DataGridItem<T>[] = event.dataItems as DataGridItem<T>[];

                const selectedsItems: ISelectedItem<T>[] = [];
                //L'index des cellules sélectionnées que nous transmet Telerik tient compte des colonnes groupées et cachées selon la règle suivante :
                //chaque groupement "ajoute" une colonne au début (l'index reçu fera un +1)
                //chaque colonne cachée (avant la colonne de la cellule sélectionnée) ne sera pas comptabilisée (l'index reçu fera un -1)
                //une autre façon de formuler la règle pour les colonnes cachées est :
                //l'index est valable pour le tableau des colonnes AFFICHÉES à l'écran
                //on calcule donc ce tableau pour pouvoir utiliser cet index
                // Encore une autre façon de formuler :
                //le fait de faire un filter fait que les index de ma liste sont alignés avec les index telerik (pour les colonnes affichées, pas pour les groupements)
                const columnsAfficheeProps = colPropsAPlat.filter(colProps => columnsVisibility[colProps.field]);
                const nbColonneGrouper: number = event.target.props.group?.length ?? 0;
                const fakeColonnesGroupees: undefined[] = Array.from({ length: nbColonneGrouper }, (v, i) => undefined);
                //Pour avoir un tableau de colonne dans lequel l'index de Telerik est valide, on ajotue de fausses colonnes correspondant aux groupements
                const colPrisesEnCompteParTelerikPourLIndex: Undefable<IGridColumnPropsExtended>[] = [...fakeColonnesGroupees, ...columnsAfficheeProps];
                if (props.isCellSelectionMode && !colPropsAPlat.some(cP => cP.cellSelectable))
                {
                    throw new Error("Incohérence : aucune cellule n'est sélectionnable alors qu'un handler 'onSelectedItemsChange' a été déclaré");
                }
                dataGridItems
                    //On retire les lignes qui sont non sélectionnées (selected à false) ou sans cellule selectionnée en mode de sélection par cellule selected à tableau vide
                    .filter(item => newSelectedState[item.dataItemKey])
                    .forEach(item =>
                    {
                        const selectedItem: ISelectedItem<T> =
                        {
                            dataItem: item.dataItem,
                        };
                        if (props.isCellSelectionMode)
                        {
                            // On a déja filtré les items qui ne sont pas sélectionnés
                            const selects: number[] = newSelectedState[item.dataItemKey] as number[];
                            selectedItem.selectedsColumnsInformations = [];
                            selects.forEach(sel =>
                            {
                                const colPropsSelected = colPrisesEnCompteParTelerikPourLIndex[sel];
                                if (colPropsSelected?.cellSelectable)
                                {
                                    const colInfo: IColumnInformation =
                                    {
                                        field: gestionRetraitNiveauDataGridItem(colPropsSelected.field),
                                        tag: colPropsSelected.tag,
                                    };
                                    selectedItem.selectedsColumnsInformations?.push(colInfo);
                                }
                                else
                                {
                                    //On n'ajoute pas
                                }
                            });

                            if (props.interdictionSelectionCellule && props.isCellSelectionMode)
                            {
                                const interdictionSelectionCellule = props.interdictionSelectionCellule;//juste pour que typescript se souvienne qu'on a vérifié que pas undefined
                                selectedItem.selectedsColumnsInformations
                                    = selectedItem.selectedsColumnsInformations.filter(colInfo => !interdictionSelectionCellule(item.dataItem, colInfo));
                            }
                            else
                            {
                                //on est sans interdiction de sélection
                            }

                            if (selectedItem.selectedsColumnsInformations?.length)
                            {
                                selectedsItems.push(selectedItem);
                            }
                            else
                            {
                                //Aucune cellule sélectionnée, on ne renvoi pas l'information
                            }
                        }
                        else
                        {
                            //Mode de selection par ligne, on n'utilise pas la propriété "selectedsColumnsInformations" et on se contente
                            //de renvoyer la ligne sélectionnée
                            selectedsItems.push(selectedItem);
                        }
                    });

                if (selectedsItems.length > 0)
                {
                    props.onSelectedItemsChange(selectedsItems);
                }
                else
                {
                    //la liste est vide
                }
            }*z/
            if (/*GridProps*z/props.onSelectionChange)
            {
                props.onSelectionChange(event);
            }
            setSelect(event.select);
        },
        [select/*selectedState*z/, props, /*colPropsAPlat, columnsVisibility*z/]
    );*/

    // All data operations, except the external filter, are handled here
    /*const finalData = useMemo((): any[] =>
    {
        const dataResult = process(data, dataState);

        setTotal(dataResult.total);
        generateGroupIds(dataResult.data as IGroupItem<T>[]);
        const dataWithExpandedState: IGroupItem<T>[] = setExpandedState({
            data: dataResult.data,
            collapsedIds: collapsedState
        });// Remarque, la doc Telerik ne précise pas ce qu'on recçoit ici, en observant au debugger je vois des groups donc je vais typer comme cela
        return dataWithExpandedState;
    }, [data, dataState, collapsedState]);*/
    // All data operations, except the external filter, are handled here
    const finalData = useMemo(() =>
    {
        let processedData = data.slice();

        processedData = process(processedData, dataState);
        setTotal(processedData.total);
        generateGroupIds(processedData.data);

        return processedData;
    }, [data, dataState, setDataState]);

    /**
     * Callback de la fonction sur l'évenement onHeaderSelectionChange de la grille
     * @param callback Le callback avec en propriété l'evenement GridHeaderSelectionChangeEvent qui retourne void (Màj du state selectedState)
     * @param deps dépendance de useCallback
     * @returns version memoized du callback

    const onHeaderSelectionChange = useCallback(
        (event: GridHeaderSelectionChangeEvent) =>
        {
            const checkboxElement = event.syntheticEvent.target as HTMLInputElement; // TODO : vérifier le type ici
            const checked = checkboxElement.checked;
            const newSelectedState = { ...selectedState };

            (event.dataItems as DataGridItem<T>[]).forEach((item) =>
            {
                newSelectedState[item.dataItemKey] = checked;
            });
            setSelectedState(newSelectedState);
        },
        [selectedState]
    );*/
    const onHeaderSelectionChange = useCallback(
        (event: GridHeaderSelectionChangeEvent) =>
        {
            setSelect(event.select);
        },
        [select]
    );

    const onGroupsExpand = useCallback(() =>
    {
        setCollapsedGroup(
            (finalData.data as any[]).reduce<GroupExpandDescriptor[]>((acc, item) =>
            {
                acc.push({
                    field: item.field,
                    value: item.value,
                    expanded: true
                });
                return acc;
            }, [])
        );
    }, [data]);

    const onGroupsCollapse = useCallback(() =>
    {
        const allGroups = groupBy(props.data, dataState.group);
        setCollapsedGroup(
            (allGroups as GroupResult[]).reduce<GroupExpandDescriptor[]>((acc, item) =>
            {
                acc.push({
                    field: item.field,
                    value: item.value,
                    expanded: false
                });
                return acc;
            }, [])
        );
    }, [data]);

    const newProps: GridProps = {
        onHeaderSelectionChange,
        children: null,
        data: finalData,
        //onSelectionChange, //je lui envoie une fonction donc je souscris à l'évenement
        onDataStateChange,
        ...dataState,
        resizable: props.resizable,
        total,
        groupExpand: collapsedGroup, //ngh
        //onExpandChange,
        onGroupExpandChange,
        //expandField: isExpandedField,
        ///////detailExpand: { },
        //selectedField: isSelectedField
        //select, //ngh
        ...selectionGridProps
    };

    /**
     * A priori c'est du code qui servirait pour avoir une colonne qui a une checkbox dans l'entête pour faciliter la sélection
     * @param callback Le callback sans paramètre qui retourne un boolean résultat du test
     * @param deps dépendance de useCallback
     * @returns version memoized du callback

    const headerSelectionValue = useCallback((): boolean =>
    {
        const selectedItems = getNumberOfSelectedItems(finalData);

        return (
            selectedItems > 0 &&
            finalData.length > 0 &&
            selectedItems === getNumberOfItems(finalData)
        );
    }, [finalData]);*/
    const headerSelectionValue = useCallback(() =>
    {
        const selectedItems = Object.values(select).filter(Boolean).length;

        return (
            selectedItems > 0 && finalData.data.length > 0 && selectedItems === getNumberOfItems(finalData.data, select)
        );
    }, [select, finalData.data]);

    /**
     * Callback de màj du collapsedState
     * @param callback Le callback sans paramètre qui return void (màj du state collapsedState)
     * @param deps dépendance de useCallback
     * @returns version memoized du callback
     */
    /*const onGroupsToggle = useCallback(() =>
    {
        setCollapsedState(
            collapsedState.length ? [] : getGroupIds({ data: finalData })
        );
    }, [collapsedState, finalData]);*/

    /**
     * Callback de la recherche dans l'entête
     * @param callback Le callback avec en paramètre l'evenement InputChangeEvent qui retourne void (màj des states filterValue et data)
     * @param deps dépendance de useCallback
     * @returns version memoized du callback
     */
    const onExternalFilterChange = useCallback((ev: InputChangeEvent): void =>
    {
        const value = ev.value;
        setFilterValue(ev.value);

        const newData = unfilteredData.filter((item) =>
        {
            let match = false;

            for (const fieldDeLaColonne in columnsVisibility)
            {
                //L'idée ici est qu'on ne fait la recherche que dans les cellules des colonnes visibles
                if (columnsVisibility[fieldDeLaColonne] && item)
                {
                    const nestedValue = getNestedValue(fieldDeLaColonne, item);
                    if (nestedValue)
                    {
                        if (nestedValue.toString()
                            .toLocaleLowerCase()
                            .indexOf(value.toLocaleLowerCase()) >= 0)
                        {
                            match = true;
                        }

                        if (nestedValue.toLocaleDateString &&
                            nestedValue.toLocaleDateString().indexOf(value) >= 0)
                        {
                            match = true;
                        }
                    }
                    else
                    {
                        // Rien à faire
                    }
                }
            }

            return match;
        });
        setData(newData);
    }, [columnsVisibility, unfilteredData]);

    /**
     * Callback qui permet de gérer la surbrillance de la recherche
     * On pourra envisager d'ajouter d'autres comportements personnalisés (ex : aligner à droite pour des valeurs numériques)
     * @param
     * callback Le callback avec en paramètre TODO et qui retourne TODO
     * @param deps dépendance de useCallback
     * @returns version memoized du callback

    const cellRender = useCallback(
        (defaultRendering: React.ReactElement<HTMLTableCellElement> | null, cellProps: GridCellProps): React.ReactElement<HTMLTableCellElement> | React.ReactElement<HTMLTableCellElement>[] | null =>
        {
            if (defaultRendering && cellProps.rowType === 'data' && !isGroupHeaderCell(cellProps))
            {
                const value = getNestedValue(cellProps.field, cellProps.dataItem)?.toString();

                if (!value)
                {
                    return defaultRendering;
                }

                if (filterValue &&
                    filterValue.length > 0 &&
                    value.toLocaleLowerCase().indexOf(filterValue.toLocaleLowerCase()) >= 0)
                {
                    const children = highlightSearchTextInReactChildren(
                        defaultRendering.props.children,
                        filterValue
                    );
                    // TODO : parait faux ici : on passe cellProps dans un tableau mais je ne vois pas comment le type pourrait correspondre
                    // si on passe un objet vide ça semble quand même fonctionner
                    // J'ai retiré le tableau et j'ai casté en any...
                    return cloneElement(defaultRendering, cellProps as any, [children]) as unknown as React.ReactElement<HTMLTableCellElement>;
                }
            }

            return defaultRendering;
        },
        [filterValue]
    );*/
    const FilterHighlightCell = useCallback(
        (cellProps: GridCustomCellProps) =>
        {
            if (cellProps.rowType === 'data')
            {
                const value = getNestedValue(cellProps.field, cellProps.dataItem)?.toString();

                if (!value)
                {
                    return <td {...cellProps.tdProps}>{cellProps.children}</td>;
                }
                if (
                    filterValue &&
                    filterValue.length > 0 &&
                    value.toLocaleLowerCase().indexOf(filterValue.toLocaleLowerCase()) >= 0
                )
                {
                    const children = highlightSearchTextInReactChildren(cellProps.children, filterValue);
                    return <td {...cellProps.tdProps}>{children}</td>;
                }
            }

            return <td {...cellProps.tdProps}>{cellProps.children}</td>;
        },
        [filterValue]
    );

    const _pdfExport = useRef<GridPDFExport | null>(null);
    const exportToPdf = (): void =>
    {
        if (_pdfExport.current)
        {
            _pdfExport.current.save();
        }
    };

    const _excelExport = useRef<ExcelExport | null>(null);
    const exportToExcel = (): void =>
    {
        if (_excelExport.current)
        {
            _excelExport.current.save();
        }
    };

    const hasCollapsed = collapsedGroup.some((g) => g.expanded === false);

    const gridChildren = useMemo(() =>
    {
        if (!columns)
        {
            return undefined;
        }

        const gridToolBar = isToolbarPanelVisible && (
            <GridToolbar className="grid-toolbar">
                {toolbarSettings.expandCollapseAllButton && isGroupable && (
                    <div>
                        {/*<ExpandCollapseButton
                            onGroupsToggle={onGroupsToggle}
                            collapse={!collapsedState.length}
                        />*/}
                        <ExpandCollapseButton
                            onClick={hasCollapsed ? onGroupsExpand : onGroupsCollapse}
                            collapse={!hasCollapsed}
                        />
                    </div>
                )}

                {toolbarSettings.externalFilter && (
                    <div className="search-panel">
                        <ExternalFilter
                            filterValue={filterValue}
                            onChange={onExternalFilterChange}
                            ref={refInputExternalFilter}
                        />
                    </div>
                )}

                <div className="control-panel">
                    <div>
                        {toolbarSettings.excelExportButton && (
                            <Button className="toolbar-button"
                                onClick={exportToExcel}
                                themeColor={TOOLBAR_BUTTON_TYPE}
                                size="small"
                                title={traduction.Common.ExporterEnExcel}
                            >
                                <RiFileExcel2Fill />
                            </Button>
                        )}
                    </div>
                    <div>
                        {toolbarSettings.pdfExportButton && (
                            <Button className="toolbar-button"
                                onClick={exportToPdf}
                                themeColor={TOOLBAR_BUTTON_TYPE}
                                size="small"
                                title={traduction.Common.ExporterEnPdf}
                            >
                                <FaFilePdf />
                            </Button>
                        )}
                    </div>
                    <div>
                        {toolbarSettings.showColumnsConfigurator && (
                            <ColumnsButton onChange={updateColumns}
                                columnsAPlatProps={colPropsAPlat /*TODO encore à faire ?*/}
                                options={columnsVisibility} />
                        )}
                    </div>
                </div>
            </GridToolbar>
        );

        const children = columns.map((col, index) =>
        {
            let isGroupeDeColonne: boolean = false;
            let isAuMoinsUneSousColonneVisible: boolean = false;
            let isColonneVisible = false;
            if (col.props.subColumnsProps !== undefined && col.props.subColumnsProps.length > 0)
            {
                //On veut gérer la visibilité des groupes de colonnes :
                // la règle devrait être : on ne contrôle que la visibilité du dernier niveau de colonne (un groupe de colonne est une colonne chez Telerik react)
                // un groupe de colonne est visible si au moins une de ses sous-colonne est visible
                isGroupeDeColonne = true;
                //On ne passe pas directement col.props.subColumnsProps car on veut tenir compte des modifications dans le field qui ne sont que dans col.props.children
                //et miseAPlatColonnes sait faire cette gestion
                isAuMoinsUneSousColonneVisible = miseAPlatColonnes([col.props]).some(subColProps => columnsVisibility[subColProps.field] === true);
                isColonneVisible = isAuMoinsUneSousColonneVisible;
            }
            else
            {
                //Ce n'est pas un groupe de colonne
                isColonneVisible = columnsVisibility[col.props.field] === true;
            }
            if (/*col.props.field === newProps.selectedField*/col.props.columnType === 'checkbox')
            {
                col.props.headerSelectionValue = headerSelectionValue();
                return col;
            }
            else if (!col.props.field)
            {
                return col;
            }
            else if (isColonneVisible)
            {
                if (isGroupeDeColonne)
                {
                    return {
                        ...col,
                        props: {
                            ...col.props,
                            //Le as unknown est nécessaire car sur IGridColumnPropsExtended on a mis le type children à never
                            //pour indiquer aux vues de passer par la propriété subColumnsProps
                            children: (col.props.children as unknown as ReactElement<IGridColumnPropsExtended>[] | null)?.filter(subCol =>
                                columnsVisibility[subCol.props.field] === true)
                        }
                    };
                }
                else
                {
                    return col;
                }
            }
            else
            {
                //La colonne n'est pas visible
                return null;
            }
        });

        if (toolbarSettings && gridToolBar)
        {
            children.push(gridToolBar);
        }

        return children;
    }, [traduction, columnsVisibility, /*collapsedState,*/ filterValue, toolbarSettings, columns, isGroupable, headerSelectionValue, /*newProps.selectedField,*/
        onExternalFilterChange, /*onGroupsToggle,*/ updateColumns, isToolbarPanelVisible, colPropsAPlat, hasCollapsed, onGroupsCollapse, onGroupsExpand]); // TODO SD20250218 voir le deprecated de newProps.selectedField

    const gridRef = useRef(null);

    // "ref" est présent dans le code de la démo, je ne sais pas si cela sert réellement
    const renderedGridProps: GridProps & { ref: any; } = {
        ...newProps,
        filterable: undefined,//On n'utilise pas les filtres de la même façon
        //selectable: isSelectable ? selectable : undefined,
        sortable: isSortable ? sortable : undefined,
        groupable: isGroupable ? isGroupable : undefined,
        pageable,
        ref: gridRef
    };

    if (toolbarSettings.filterHighlights)
    {
        //renderedGridProps.cellRender = cellRender;

        if (!renderedGridProps.cells)
        {
            renderedGridProps.cells = {};
        }
        renderedGridProps.cells.data = FilterHighlightCell;
    }

    let className: string = "grid-helper-component grid-helper-component2";
    if (props.className)
    {
        // On ajoute la ou les classes passées en props
        className = `${className} ${props.className}`;
    }
    else
    {
        // Rien à faire
    }

    if (isToolbarPanelVisible)
    {
        //Permet d'appliquer certain style spécifiques quand il y a un entête pour grouper à la grille
        className = `${className} grid-helper-with-toolbar-panel`;
    }
    else
    {
        //Rien à faire
    }

    // On crée une nouvelle grille qui sera celle affichée
    const GridComponent
        = (<Grid {...renderedGridProps} className={className}>
            {gridChildren}
        </Grid>);

    return (
        <>
            {
                isToolbarPanelVisible &&
                <>
                    <GridPDFExport ref={_pdfExport} margin="1cm">
                        {GridComponent}
                    </GridPDFExport>
                    <ExcelExport
                        data={finalData}
                        ref={_excelExport}
                        columns={exportColumns.filter(
                            (col) => columnsVisibility[col.field ?? fake_Field]
                        ).map(col =>
                        {
                            // Le type de la propriété "width" était incompatible avec celui de ExcelExportColumnProps
                            return { ...col, width: col.width as number ?? 50 };
                        }
                        )}
                        group={dataState.group}
                    />
                </>
            }
            {GridComponent}
        </>
    );
}