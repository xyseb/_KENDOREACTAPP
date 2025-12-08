/* eslint-disable max-lines-per-function */
import {Children, ReactElement, ReactNode, cloneElement, forwardRef, isValidElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { AggregateDescriptor, SortDescriptor, /*State,*/ process } from '@progress/kendo-data-query';
import { Button, ButtonHandle } from '@progress/kendo-react-buttons';
import
{
    SortSettings,
    //getGroupIds, //gh
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

import { useAtomValue } from 'jotai';
//import { traductionAtom } from '@/Atoms/TraductionAtom';
import { utilisateurAtom } from '../atoms/UtilisateurAtom';

import './HGrid.scss';


export class DataGridItem<T>
{
    //isChecked: boolean;

    /**
     * Le nom de cette propriété doit être la même que pour les groupes item "IGroupItem" de la grille car visiblement c'est comme ça que fonctionne telerik
     * Attention, si vous souhaitez renommer cette propriété, il faudra gérer "manuellement" la valeur de cette propriété car "setExpandedState" qu'on utilise actuellement
     * ne met à jour que la propriété avec le nom "expanded"
     */
    //expanded: boolean;
    /*
     * Selection : soit un boolean indiquant qu'une ligne est sélectionnée via la dataItemKey
     * ou un tableau d'index de colonne indiquant les cellules de la ligne qui sont sélectionnées
     * Remarque : cette propriété travaille sur un index qui peut varier en fonction de la présentation de la grille introduisant
     * des dysfonctionnements suivant que les colonnes de la grille soient groupées ou cachées
     * Privilégier l'utilisation de l'interface ISelectedColumnByFieldName plutôt
     */
    //selected: boolean | number[] | undefined;

    dataItem: T;
    //groupId?: string | number;
    //dataItemKey: string | number;
    /**
     * Construit un item de Grid
     * @param dataItem TODO
     * @param keySelector TODO
     */
    constructor(dataItem: T/*, keySelector: (d: T) => string | number*/)
    {
        //this.isChecked = false;
        //this.expanded = false;
        //this.selected = false;
        this.dataItem = dataItem;
        //this.dataItemKey = keySelector(dataItem);
    }
}

/**
 * Permet d'obtenir la valeur d'une propriété au chemin (fieldName) indiqué
 * @param fieldName - Chemin de la propriété à lire (ex: "user.name")
 * @param dataItem - dataItem provenant de la grille sur lequel on recherche à lire
 * @returns la valeur indiquée par le fieldName dans dataItem
 * 
 * @example <caption>Code original de GridHelper avant modification (pour mémoire)</caption>
 * ```ts
 * export function getNestedValue(fieldName, dataItem) {
 *     const path = (fieldName || '').split('.');
 *     let data = dataItem;
 *     path.forEach((p) => {
 *         data = data ? data[p] : undefined;
 *     });
 *     return data;
 * }
 * ```
 */
export function getNestedValue<T>(fieldName: string, dataItem: T): unknown | undefined {
    const path = (fieldName || '').split('.');
    let data: any = dataItem;

    path.forEach((p) => {
        data = data ? data[p] : undefined;
    });

    return data;
}

/**
 * Met en surbrillance toutes les occurrences du texte `filter` dans la chaîne `value`.
 *
 * Cette fonction est récursive : à chaque occurrence trouvée, elle découpe la chaîne,
 * insère un élément `<span>` avec un fond coloré, puis continue la recherche
 * sur le reste du texte.
 *
 * @param value - La chaîne de texte dans laquelle rechercher les occurrences.
 * @param filter - Le texte à mettre en surbrillance (non sensible à la casse).
 * @returns Un fragment React contenant le texte avec les occurrences mises en surbrillance.
 *
 * @example <caption>Code original de GridHelper avant modification (pour mémoire)</caption>
 * ```ts
 * const getHighlight = (value, filter) => {
 *     let index = value.toLocaleLowerCase().indexOf(filter.toLocaleLowerCase());
 *     if (index >= 0) {
 *         let left = value.substring(0, index);
 *         let right = value.substring(index + filter.length, value.length);
 *         return (
 *             <React.Fragment>
 *                 {left}
 *                 <span style={{ backgroundColor: '#a8edb3' }}>
 *                     {value.substring(index, filter.length)}
 *                 </span>
 *                 {getHighlight(right, filter)}
 *             </React.Fragment>
 *         );
 *     }
 *     return value;
 * };
 * ```
 */
const getHighlight = (value: string, filter: string): React.ReactNode => {
    const index = value.toLocaleLowerCase().indexOf(filter.toLocaleLowerCase());
    if (index >= 0) {
        const left = value.substring(0, index); // fix hestia value.substr(0, index);
        const right = value.substring(index + filter.length, value.length);
        return (
            <>
                {left}
                <span style={{ backgroundColor: '#a8edb3' }}>{value.substring(index, filter.length)/* fix hestia value.substr(index, filter.length)*/}</span>
                {getHighlight(right, filter)}
            </>
        );
    }
    return value;
};

/**
 * (❌)
 * Mise en surbrillance d'un texte dans le html des enfants d'un contrôle
 * @param children les éléments enfants d'un contrôle
 * @param searchText le texte à rechercher
 * @returns le noeud html
 *
 * @example <caption>Code original de GridHelper avant modification (pour mémoire)</caption>
 * ```ts
 * function highlightSearchTextInReactChildren(children, searchText) {
 *     function highlightInNode(node) {
 *         if (typeof node === 'string') {
 *             const modifiedContent = node.replace(
 *                 new RegExp(`(${searchText})`, 'gi'),
 *                 '<span style="background-color:#a8edb3">$1</span>'
 *             );
 *             if (node !== modifiedContent) {
 *                 return <span dangerouslySetInnerHTML={{ __html: modifiedContent }} />;
 *             }
 *         } else if (React.isValidElement(node)) {
 *             if (!node.props.children?.map) {
 *                 return React.cloneElement(node, {}, highlightInNode(node.props.children));
 *             } else {
 *                 return React.cloneElement(
 *                     node,
 *                     {},
 *                     node.props.children?.map((ch) => highlightInNode(ch))
 *                 );
 *             }
 *         }
 *         return node;
 *     }
 *     return React.Children.map(children, (child) => highlightInNode(child));
 * }
 * ```
 */
function highlightSearchTextInReactChildren(children: React.ReactNode, searchText: string): React.ReactNode {
    /**
     * Mise en surbrillance d'un texte donné dans un node
     * @param node le noeud dans lequel on souhaite appliquer la surbrillance
     * @returns le noeud react
     */
    function highlightInNode(node: React.ReactNode): React.ReactNode {
        if (typeof node === 'string') {
            const modifiedContent = node.replace(
                new RegExp(`(${searchText})`, 'gi'),
                '<span style="background-color:#a8edb3">$1</span>'
            );
            if (node !== modifiedContent) {
                return <span dangerouslySetInnerHTML={{ __html: modifiedContent }} />;
            }
        } else if (isValidElement(node)) {
            if (!node.props.children?.map) {
                return cloneElement(node, {}, highlightInNode(node.props.children));
            } else {
                return cloneElement(
                    node,
                    {},
                    node.props.children?.map((ch: React.ReactNode) => highlightInNode(ch))
                );
            }
        }
        return node;
    }
    return Children.map(children, (child: React.ReactNode) => {
        return highlightInNode(child);
    });
}

/**
 * (fn de GridHelper)
 * Nombre d'item (incluant les éléments regroupés)
 * @param data Les items ou groupes de la grille
 * @param select - Sélecteur KendoReact pour déterminer les éléments sélectionnés
 * @returns le nombre total d'items
 *
 * @example <caption>Code original avant modification pour mémoire</caption>
 * ```ts
 * const getNumberOfItems = (data, select) => {
 *     let count = 0;
 *     data.forEach((item) => {
 *         if (item.items) {
 *             count = count + getNumberOfItems(item.items, select);
 *         } else {
 *             count++;
 *         }
 *     });
 *     return count;
 * };
 * ```
 */
function getNumberOfItems<T>(data: Array<T | (GroupResult & { items?: Array<T | GroupResult> })>, select: SelectDescriptor): number {
    let count = 0;
    data.forEach((item) => {
        if (item.items) {
            count = count + getNumberOfItems(item.items, select);
        } else {
            count++;
        }
    });
    return count;
}

/**
 * (fn de GridHelper)
 * Pour chaque groupe dans `data`, crée une clé unique `groupId`.
 * Fonction récursive pour gérer tous les niveaux de sous-groupes.
 *
 * @param data - Les informations sur les groupes ou les items des groupes
 *
 * @example <caption>Code original avant modification pour mémoire</caption>
 * ```ts
 * const generateGroupIds = (data) => {
 *     data.forEach((item) => {
 *         if (item.aggregates) {
 *             item.groupId = item.field + '_' + item.value;
 *             generateGroupIds(item.items);
 *         }
 *     });
 * };
 * ```
 */
function generateGroupIds<T>(data: Array<T | (GroupResult & { items?: Array<T | GroupResult> })>): void {
    data.forEach((item) => {
        // Vérifie si l'objet est un groupe (possède des agrégats)
        if ('aggregates' in item && item.aggregates) {
            item.groupId = `${item.field}_${item.value}`;
            // Récursion sur les sous-éléments
            if ('items' in item && item.items) {
                generateGroupIds(item.items);
            }
        }
    });
}

/**
 * Récupère les titres des colonnes visibles d'une grille KendoReact sous forme de lookup.
 *
 * Parcourt les enfants du Grid et ne retient que ceux de type `KendoReactGridColumn`
 * ayant un champ `field` défini et différent de 'selected', car les colonnes de type
 * 'selected' sont généralement utilisées pour les checkbox de sélection et ne représentent
 * pas des colonnes de données à afficher ou configurer.
 *
 * Chaque titre devient une clé dans l'objet retourné, avec pour valeur `true`. Ce lookup
 * sert à gérer facilement l'état de visibilité des colonnes dans GridHelper
 * (affichage conditionnel, configurateur de colonnes, export, etc.).
 *
 * @param gridChildren - Les enfants de la grille (ReactNode[])
 * @returns Un lookup avec les titres des colonnes visibles comme clés et `true` comme valeurs
 *
 * @example <caption>Code original avant modification pour mémoire</caption>
 * ```ts
 * const getDataColumnsTitles = (gridChildren) => {
 *     let columns = {};
 *     gridChildren.forEach((child) => {
 *         if (
 *             child.type.displayName === 'KendoReactGridColumn' &&
 *             child.props.field &&
 *             child.props.field !== 'selected'
 *         ) {
 *             columns[child.props.title ?? child.props.field] = true;
 *         }
 *     });
 *     return columns;
 * };
 * ```
 */
function getVisibleColumnTitles(gridChildren: ReactElement<GridColumnProps, typeof GridColumn>[]): Record<string, true> {
    const columns: Record<string, true> = {};

    gridChildren.forEach((child: ReactElement<GridColumnProps, typeof GridColumn>) => {
        if (
            child.type?.displayName === 'KendoReactGridColumn' &&
            child.props?.field &&
            child.props.field !== 'selected'
        ) {
            columns[child.props.title ?? child.props.field] = true;
        }
    });

    return columns;
}

/** 
 * * Récupère les propriétés des colonnes “données” d'une grille KendoReact.
 *
 * Parcourt les enfants de la grille et ne retient que ceux de type `KendoReactGridColumn`
 * avec un champ `field` défini et différent de 'selected', car les colonnes de type
 * 'selected' correspondent à des checkbox de sélection et ne sont pas des colonnes de données.
 *
 * Le résultat est un tableau des `props` de ces colonnes, pratique pour
 * l'export Excel, PDF, ou toute autre opération nécessitant de connaître les colonnes réelles.
 *
 * @param gridChildren - Les enfants de la grille (ReactNode[])
 * @returns Un tableau des props des colonnes de données (GridColumnProps)
 *
 * @example <caption>Code original avant modification pour mémoire</caption>
 * ```ts
 * const getGridFieldColumns = (gridChildren) => {
 *     let fieldColumns: Array<any> = [];
 *     gridChildren.map((child: any) => {
 *         if (
 *             child.type.displayName === 'KendoReactGridColumn' &&
 *             child.props &&
 *             child.props.field &&
 *             child.props.field !== 'selected'
 *         ) {
 *             fieldColumns.push(child.props);
 *         }
 *     });
 *     return fieldColumns;
 * };
 * ```
 */
function getVisibleGridColumns(gridChildren: ReactElement<GridColumnProps, typeof GridColumn>[]): GridColumnProps[] {
    const fieldColumns: GridColumnProps[] = [];

    gridChildren.forEach((child: ReactElement<GridColumnProps, typeof GridColumn>) => {
        if (
            child.type?.displayName === 'KendoReactGridColumn' &&
            child.props?.field &&
            child.props.field !== 'selected'
        ) {
            fieldColumns.push(child.props);
        }
    });

    return fieldColumns;
}


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
    //const traduction = useAtomValue(traductionAtom);

    return (
        <>
            <Input className="external-filter-input"
                value={props.filterValue ? props.filterValue : undefined}
                onChange={props.onChange}
                placeholder={'`${traduction.Common.Rechercher} :`'}
                ref={ref}
            />
            <FaMagnifyingGlass className="external-filter-input-loupe" />
        </>
    );
});

const TOOLBAR_BUTTON_TYPE = "primary";

interface IExpandCollapseButtonOwnProps
{
    onClick: () => void;
    collapse: boolean;
}

/**
 * Bouton permettant de tout déplier ou de tout replier (n'est pas utilisé pour le moment)
 * @param props Les props react
 * @returns bouton déplier/replier
 */
const ExpandCollapseButton = (props: Readonly<IExpandCollapseButtonOwnProps>): JSX.Element =>
{
    //const traduction = useAtomValue(traductionAtom);

    return (
        <Button
            onClick={props.onClick}
            themeColor={TOOLBAR_BUTTON_TYPE}
            size="small"
            title={!props.collapse ? 'traduction.Common.TelerikDevelopperGroupes' : 'traduction.Common.TelerikReduireGroupes'}
            svgIcon={props.collapse ? chevronDoubleDownIcon : chevronDoubleRightIcon}
        >
        </Button>
    );
};

interface IColumnsButtonOwnProps
{
    options: IDictionary<boolean>;
    //columnsAPlatProps: IGridColumnPropsExtended[];
    flatColumns: IFlatColumn[];
    onChange: (setting: string, checkBoxValue: boolean) => void;
}

interface IConfiguratorButtonBaseOwnProps extends IColumnsButtonOwnProps
{
    title: string;
    icon?: JSX.Element;
}

///////////////////////////////////////////////////////////////////////////
interface IFlatColumn {
    field: string;
    title: string;
    parentTitle?: string;
    original: ReactElement<GridColumnProps, typeof GridColumn>;
}

function flattenColumns(
    cols: ReactElement<GridColumnProps, typeof GridColumn>[],
    parentTitle?: string
): IFlatColumn[] {
    const out: IFlatColumn[] = [];

    cols.forEach(col => {
        const props = col.props as GridColumnProps;

        if (props.field) {
            out.push({
                field: props.field,
                title: props.title ?? props.field,
                parentTitle,
                original: col,
            });
        }

        const children = props.children;
        if (children) {
            const childArray = Array.isArray(children) ? children : [children];
            const subCols = childArray.filter(
                c => isValidElement(c)
            ) as ReactElement<GridColumnProps, typeof GridColumn>[];

            out.push(
                ...flattenColumns(subCols, props.title)
            );
        }
    });

    return out;
}
/////////////////////////////////////////////////////////////////////////////

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
     *z/
    const getPopupContent = useCallback((): ReactElement[] =>
    {
        let parentTitleOld: string = "";
        return (Object.entries(props.options).map(([key, value], index) =>
        {
            const isVisible = value;
            //const colProps: IGridColumnPropsExtended = props.columnsAPlatProps.filter(c => c.field === key)[0];
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
    }, [props]);*/
    const getPopupContent = useCallback((): ReactElement[] => {
        let parentTitleOld = "";

        return Object.entries(props.options).map(([key, isVisible], index) => {

            const colProps = props.flatColumns.find(c => c.field === key);
            if (!colProps) return <div key={index}></div>;

            const parentTitle = colProps.parentTitle ?? "";

            let parentDisplayed: ReactElement = <></>;

            if (parentTitle !== parentTitleOld) {
                parentDisplayed = (
                    <span className="parent-title" key={`parent-${index}`}>
                        {parentTitle}
                    </span>
                );
            }

            parentTitleOld = parentTitle;

            return (
                <div key={index}>
                    {parentDisplayed}
                    <div className="column">
                        <div className="check-box">
                            <Checkbox
                                value={isVisible}
                                onChange={ev => props.onChange(key, ev.value)}
                                data-attr={key}
                            />
                        </div>
                        <span className="label">{colProps.title}</span>
                    </div>
                </div>
            );
        });
    }, [props/*.options, props.onChange, props.flatColumns*/]);

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
    //const traduction = useAtomValue(traductionAtom);

    return (
        <ConfiguratorButtonBase
            {...props}
            icon={<FaTools />}
            title={'traduction.Common.TelerikAfficherCacherColonnes'}
        />
    );
};

interface IToolbarSettings
{
    externalFilter: boolean; // C'est le champ de recherche dans tous les champs en haut
    filterHighlights: boolean; // Surbrillance des resultats de la recherche
    expandCollapseAllButton: boolean; // Bouton relatif aux groupements
    excelExportButton: boolean; // Export Excel
    pdfExportButton: boolean; // Export PDF
    showColumnsConfigurator: boolean; // Choix d'affichage de colonne
    showFeatureConfigurator: boolean; // Permettre à l'utilisateur une configuration des fonctionnalités de grille qu'il veut
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

/**
 * Interface des props/children du composant GridHelper
 */
interface IHGridOwnProps<T, K extends keyof T> extends Omit<GridProps,
    "dataItemKey" | // Surchargé pour le rendre obligatoire
    "children" | // Typé pour être plus précis mais basé sur Grid
    "selectable" | "defaultSelect"| "select" | "onSelectionChange" | // usage similaire mais simplifié
    "navigatable" |
    "locale" | "language" // uniquement SSR (server side rendering)
    >
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
    hToolbarSettings?: IToolbarSettings;
    /**
     * Props telerik de GridProps représentant un selecteur donnée correspondant à la ligne
     * On la surcharge pour la rendre obligatoire car peut être undefined mais l'usage est sur tellement de features de Grid
     * ATTENTION case sensitive. Bien mettre la casse tel que dans definit pour l'entité de data donné à la grille
     */
    dataItemKey: K

    data: T[];

    initialDataState?: State;

    selectable?: HSelectable;

    //filterable?: boolean; // INHERIT
    //groupable?: boolean; //A REVOIR
    //sortable?: boolean; // A REVOIR
    //pageable?: IPageable; // A REVOIR
    //resizable?: boolean; // INHERIT
    //reorderable?: boolean; // INHERIT
    //navigatable?: boolean | NavigatableSettings; // A REVOIR

    isToolbarPanelVisible?: boolean;
    //keySelector: (d: T) => string | number;
    //children?: never;
    //children?: HGridColumnElement | HGridColumnElement[];
    //columnsProps: IGridColumnPropsExtended[];
    //hColumnsProps?: GridColumnProps[];
}

/**
 * Cas d'usage 1 : children explicitement donnés et pas de colonnes via props
 */
interface IHGridWithChildren<T, K extends keyof T> extends IHGridOwnProps<T, K> {
  children: ReactElement<GridColumnProps, typeof GridColumn> | ReactElement<GridColumnProps, typeof GridColumn>[];
  hColumnsProps?: never;
}

/**
 * Cas d'usage 2 : pas de children et colonnes via props
 */
interface IHGridWithHColumns<T, K extends keyof T> extends IHGridOwnProps<T, K> {
  children: never;
  hColumnsProps: GridColumnProps[];
}

type HGridOwnProps<T, K extends keyof T> = IHGridWithChildren<T, K> | IHGridWithHColumns<T, K>;


interface IUtilisateur {
    Login: string;
}
function DroitTrierGrouperFilterRechercherHGrid(utilisateur: IUtilisateur){return true;}

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
export default function HGrid<T, K extends keyof T>(props: Readonly<HGridOwnProps<T, K>>): JSX.Element
//export const GridHelper = <T,>(props: Readonly<IGridHelperOwnProps<T>>): JSX.Element =>
{
    //STATES
    const utilisateur = useAtomValue(utilisateurAtom) as IUtilisateur; // Forcement connecté donc considéré non null via "as IUtilisateur"
    //const traduction = useAtomValue(traductionAtom);

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

    // On autorise le toolbar panel que si on veut grouper, trier ou filtrer et qu'on a les droits de le faire
    const isToolbarPanelVisible = (props.isToolbarPanelVisible !== false) && (isGroupable || isSortable || isFilterable);

    const toolbarSettings = useMemo<IToolbarSettings>(() => props.hToolbarSettings ?? {
        filterHighlights: true,
        expandCollapseAllButton: false,
        pdfExportButton: true,
        excelExportButton: true,
        externalFilter: true,
        showColumnsConfigurator: true,
        showFeatureConfigurator: true
    }, [props.hToolbarSettings]);

    const pageable = props.pageable;

    const [unfilteredData, setUnfilteredData] = useState<DataGridItem<T>[]>([]);
    const [data, setData] = useState(unfilteredData);
    const dataItemsSelection = useRef<T[] | { dataItem: T, colFields: string[] }[]>([]);

    const getColumnFieldByIndex = (index: number) => "ok";
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

    /*
     * State provenant HGrid permettant d'avoir une description des opérations a faire sur les données tels que filtre
     * , groupement...
     */
    const [dataState, setDataState] = useState<State>({
        ...props.initialDataState,
        // skip: 0,
        // take: 10,
        //sort: props.initialDataState?.sort?.map(s => ({ ...s, field: gestionAjoutNiveauDataGridItem(s.field) })),
        //group: props.initialDataState?.group?.map(g => ({ ...g, field: gestionAjoutNiveauDataGridItem(g.field) })),
    }/* ?? { skip: null }*/);

    /*const columns = useMemo<ReactElement<IGridColumnPropsExtended>[]>(() => replaceGridColumns(dataState, props.columnsProps, isFilterable)
        , [dataState, props.columnsProps, isFilterable]);*/

    const columns = useMemo(() => {
        return props.children ??
            Array.isArray(props.hColumnsProps)
                ? props.hColumnsProps!.map((c, i) => <GridColumn key={i} {...c} />) as unknown as ReactElement<GridColumnProps, typeof GridColumn>[]
                : props.hColumnsProps
                    ? [props.hColumnsProps].map((c, i) => <GridColumn key={i} {...c} />) as unknown as ReactElement<GridColumnProps, typeof GridColumn>[]
                    : []
    }, [props.hColumnsProps, props.children]);

    /////////////////////////////////////////////////////////////////////////
    const flatColumns = useMemo(() => flattenColumns(columns), [columns]);
    ////////////////////////////////////////////////////////////////////////////

    const refInputExternalFilter = useRef<InputHandle>(null);
    const [filterValue, setFilterValue] = useState<string | null>(null);// TODO peut être null remplacer par undefined
    useEffect(() =>
    {
        // Pour conserver le curseur sur le champ de saisie de la recherche
        refInputExternalFilter.current?.element?.focus();
    }, [filterValue]);

    const [exportColumns] = useState<GridColumnProps[]>(getVisibleGridColumns(columns));

    useEffect(() =>
    {
        const dataGridItems = props.data.map(d => new DataGridItem(d/*, props.keySelector*/));
        setUnfilteredData(dataGridItems);
        setData(dataGridItems);
    }, [props.data/*, props.keySelector*/]);

    /**
     * Les props de colonnes de dernier niveau
     *z/
    const colPropsAPlat = useMemo<IGridColumnPropsExtended[]>(() =>
    {
        return miseAPlatColonnes(columns.map(c => c.props));
    }, [columns]);*/

    /**
     * Callback de renvoi un objet ayant comme propriété le nom des colonnes ou le nom des fields des colonnes
     * TODO : ajouter une propriété uniqueName comme côté WPF ? Servira également pour les personnalisations
     * cf https://stackoverflow.com/a/75737717 pour les types
     * @param callback Callback recevant les paramètres de la grille (y compris les enfants ".children") et retournant le dictionaire noms de colonnes/noms de champs
     * @param deps dépendance de useCallback
     * @returns version memoized du callback
     *z/
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
    }, []);*/

    const [columnsVisibility, setColumnsVisibility] = useState<IDictionary<boolean>>({});
    const [columnsState, setColumnsState] = useState(getVisibleColumnTitles(/*GridProps.children*/columns));
    /*useEffect(() =>
    {
        setColumnsVisibility(initColumnsVisibility(colPropsAPlat));
    }, [setColumnsVisibility, initColumnsVisibility, colPropsAPlat]);*/

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
                const col = columns.find(c => c.props.field === group.field); //Ex columns.find
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
                                title={'traduction.Common.ExporterEnExcel'}
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
                                title={'traduction.Common.ExporterEnPdf'}
                            >
                                <FaFilePdf />
                            </Button>
                        )}
                    </div>
                    <div>
                        {toolbarSettings.showColumnsConfigurator && (
                            <ColumnsButton onChange={updateColumns}
                                //columnsAPlatProps={colPropsAPlat /*TODO encore à faire ?*/}
                                flatColumns={flatColumns}
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
    }, [/*traduction,*/ columnsVisibility, /*collapsedState,*/ filterValue, toolbarSettings, columns, isGroupable, headerSelectionValue, /*newProps.selectedField,*/
        onExternalFilterChange, /*onGroupsToggle,*/ updateColumns, isToolbarPanelVisible, /*colPropsAPlat,*/ hasCollapsed, onGroupsCollapse, onGroupsExpand]); // TODO SD20250218 voir le deprecated de newProps.selectedField

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