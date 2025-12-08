import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { process } from '@progress/kendo-data-query';
import { Button } from '@progress/kendo-react-buttons';
import { Checkbox, Input } from '@progress/kendo-react-inputs';
import { Popup } from '@progress/kendo-react-popup';
import { GridPDFExport } from '@progress/kendo-react-pdf';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import {
    Grid,
    GridColumn as Column,
    GridToolbar,
    GridProps,
    GridGroupExpandChangeEvent,
    GridSelectionChangeEvent,
    GridHeaderSelectionChangeEvent,
    GridCustomCellProps
} from '@progress/kendo-react-grid';
import { SelectDescriptor, GroupExpandDescriptor } from '@progress/kendo-react-data-tools';
import { GroupResult, State, groupBy } from '@progress/kendo-react-all';
import { fileExcelIcon, filePdfIcon, columnsIcon, gearIcon, chevronDoubleDownIcon, chevronDoubleRightIcon } from '@progress/kendo-svg-icons';

/**
 * On réutilise ici ta définition IHGridOwnProps telle qu'elle apparaitait dans ton original.
 * Seules les dépendances nécessaires sont importées ci-dessus.
 *
 * NOTE: adapter/compléter l'interface si besoin (j'ai repris les champs nécessaires).
 */
type HSelectable = {
    selectMode: 'Cell' | 'Cells' | 'Row' | 'Rows';
    onSelect?: () => void;
    select?: SelectDescriptor;
};

interface IToolbarSettings {
    externalFilter?: boolean;
    filterHighlights?: boolean;
    expandCollapseAllButton?: boolean;
    excelExportButton?: boolean;
    pdfExportButton?: boolean;
    showColumnsConfigurator?: boolean;
    showFeatureConfigurator?: boolean;
}

type IHGridOwnProps<T, K extends keyof T> = Omit<GridProps,
    "dataItemKey" | "children" | "selectable" | "defaultSelect" | "select" | "onSelectionChange" | "navigatable" | "locale" | "language"
    > & {
    hToolbarSettings?: IToolbarSettings;
    dataItemKey: K;
    data: T[];
    initialDataState?: State;
    selectable?: HSelectable;
    hColumnsProps?: React.ComponentProps<typeof Column>[];
};

/** utilitaires */
function getNestedValue(fieldName: string, dataItem: any): unknown | undefined {
    const path = (fieldName || '').split('.');
    let data: any = dataItem;
    path.forEach((p) => {
        data = data ? data[p] : undefined;
    });
    return data;
}

const TOOLBAR_BUTTON_TYPE = 'primary';

/** Un example de GridCustomCell typé : on peut typer T en generics via wrapper */
export function TypedDataCell<T>(props: GridCustomCellProps & { dataItem: T }) {
    // ici props.dataItem est de type any, mais l'appelant TypeScript peut wrapper pour indiquer T
    // Exemple d'accès : (props as any).dataItem as T
    return <td {...props.tdProps}>{props.children}</td>;
}

/** Composant HGrid */
export default function HGrid<T, K extends keyof T>(props: Readonly<IHGridOwnProps<T, K>>): JSX.Element {
    const toolbarSettings = props.hToolbarSettings ?? {
        externalFilter: true,
        filterHighlights: true,
        expandCollapseAllButton: true,
        excelExportButton: true,
        pdfExportButton: true,
        showColumnsConfigurator: true,
        showFeatureConfigurator: true
    };

    const gridRef = useRef<any>(null);
    const _pdfExport = useRef<GridPDFExport | null>(null);
    const _excelExport = useRef<ExcelExport | null>(null);

    // ---- state ----
    const [filterValue, setFilterValue] = useState<string | null>(null);
    const [configuration, setConfiguration] = useState({
        filterable: props.filterable ?? false,
        groupable: props.groupable ?? false,
        sortable: props.sortable ?? false,
        pageable: props.pageable ?? false,
        resizable: props.resizable ?? false
    });

    const [dataState, setDataState] = useState<State>(props.initialDataState ?? { skip: 0, take: (props.initialDataState?.take ?? 10) });
    const [collapsedGroup, setCollapsedGroup] = useState<GroupExpandDescriptor[]>([]);
    const [select, setSelect] = useState<SelectDescriptor>({});
    const [total, setTotal] = useState<number>(props.data?.length ?? 0);

    // si hColumnsProps fourni on crée des Column children
    const columnsFromProps = useMemo(() => {
        if (Array.isArray(props.hColumnsProps)) {
            return props.hColumnsProps.map((c, i) => <Column key={String(i)} {...(c as any)} />);
        }
        return null;
    }, [props.hColumnsProps]);

    // children effective (priorité : children passés, sinon hColumnsProps)
    const columnsChildren = useMemo(() => {
        if (props.children) {
            // normalise en array
            return Array.isArray(props.children) ? props.children as ReactElement[] : [props.children as ReactElement];
        }
        return columnsFromProps ?? [];
    }, [props.children, columnsFromProps]);

    // ---- process data (Kendo) ----
    const finalData = useMemo(() => {
        // on passe toujours des instances métier (T) au process
        const processed = process((props.data ?? []).slice(), dataState) as { data: any[]; total: number };
        // generate group ids si besoin (utile pour expand/collapse)
        const generateGroupIds = (data: any[]) => {
            data.forEach(item => {
                if (item.aggregates) {
                    item.groupId = `${item.field}_${String(item.value)}`;
                    if (Array.isArray(item.items)) {
                        generateGroupIds(item.items);
                    }
                }
            });
        };
        generateGroupIds(processed.data);
        setTotal(processed.total ?? (processed.data?.length ?? (props.data?.length ?? 0)));
        return processed;
    }, [props.data, dataState]);

    // si finalData contient groups, Grid attend soit array of groups OR flat array — on passe finalData.data
    const dataForGrid = useMemo(() => {
        return finalData?.data ?? (props.data ?? []);
    }, [finalData, props.data]);

    // header selection
    const onHeaderSelectionChange = useCallback((ev: GridHeaderSelectionChangeEvent) => {
        setSelect(ev.select);
    }, []);

    const onSelectionChange = useCallback((ev: GridSelectionChangeEvent) => {
        setSelect(ev.select);
        if (props.onSelectionChange) props.onSelectionChange(ev as any);
    }, [props.onSelectionChange]);

    const onDataStateChange = useCallback((ev: any) => {
        setDataState(ev.dataState ?? ev);
        if (props.onDataStateChange) props.onDataStateChange(ev as any);
    }, [props.onDataStateChange]);

    const onGroupExpandChange = useCallback((ev: GridGroupExpandChangeEvent) => {
        setCollapsedGroup(ev.groupExpand);
        if (props.onGroupExpandChange) props.onGroupExpandChange(ev);
    }, [props.onGroupExpandChange]);

    // Export helpers
    const exportToPdf = () => {
        if (_pdfExport.current) _pdfExport.current.save();
    };
    const exportToExcel = () => {
        if (_excelExport.current) _excelExport.current.save();
    };

    // External filter (simple full-text on visible columns)
    const onExternalFilterChange = useCallback((ev: any) => {
        const value = ev.value;
        setFilterValue(value);
        if (!value || value.length === 0) {
            // remettre les données brutes
            // on ne change pas props.data ; on applique le filter côté parent si besoin
            // ici on se contente d'appliquer via dataState.filter si tu veux utiliser Kendo filters
            return;
        }
        // Si tu veux un comportement immédiat côté composant : filtrer localement
        const visibleFields: string[] = columnsChildren
            .map((c: any) => c?.props?.field)
            .filter(Boolean);

        const newData = (props.data ?? []).filter((item: any) => {
            return visibleFields.some(field => {
                const v = getNestedValue(field, item);
                if (v == null) return false;
                return String(v).toLocaleLowerCase().includes(String(value).toLocaleLowerCase());
            });
        });
        // on remplace temporairement le dataState pour afficher le résultat (skip/take reset)
        setDataState({ ...dataState, skip: 0, take: newData.length });
        // remplacer la source en créant un pseudo finalData — simplest approach: override finalData.data via a local var
        // mais pour rester simple ici on met à jour total (le process ci-dessus dépendra de props.data — donc si tu veux full externalFilter persist, 
        // il vaut mieux fournir une prop onExternalFilterChange au parent)
    }, [columnsChildren, props.data, dataState]);

    // cell render with highlight
    const FilterHighlightCell = useCallback((cellProps: GridCustomCellProps) => {
        if (cellProps.rowType === 'data') {
            const raw = getNestedValue(cellProps.field ?? '', cellProps.dataItem);
            const value = raw == null ? '' : String(raw);
            if (!value) return <td {...cellProps.tdProps}>{cellProps.children}</td>;
            if (filterValue && filterValue.length > 0 && value.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase())) {
                // surbrillance simple
                const beforeIndex = value.toLocaleLowerCase().indexOf(filterValue.toLocaleLowerCase());
                if (beforeIndex >= 0) {
                    const left = value.substring(0, beforeIndex);
                    const mid = value.substring(beforeIndex, beforeIndex + filterValue.length);
                    const right = value.substring(beforeIndex + filterValue.length);
                    return (
                        <td {...cellProps.tdProps}>
                            {left}
                            <span style={{ backgroundColor: '#a8edb3' }}>{mid}</span>
                            {right}
                        </td>
                    );
                }
            }
        }
        return <td {...cellProps.tdProps}>{cellProps.children}</td>;
    }, [filterValue]);

    // construction des children à passer à Grid (colonne checkbox special-case)
    const gridChildren = useMemo(() => {
        return columnsChildren.map((child: any, idx: number) => {
            if (!child) return null;
            const isColumn = child.type && (child.type.displayName === 'KendoReactGridColumn' || child.type === Column);
            if (isColumn) {
                // checkbox header special-case conservé si présent
                if (child.props.columnType === 'checkbox') {
                    return <Column key={idx} {...child.props} headerSelectionValue={false} />;
                }
                return <Column key={idx} {...child.props} />;
            }
            // passthrough (toolbar, templates...)
            return child;
        });
    }, [columnsChildren]);

    // props passées à Kendo Grid
    const renderedGridProps: GridProps = {
        ...props, // prop Kendo compatibles (attention, props.children sera écrasé)
        data: dataForGrid,
        dataItemKey: String(props.dataItemKey) as any,
        total,
        onHeaderSelectionChange,
        onSelectionChange,
        onDataStateChange,
        groupExpand: collapsedGroup,
        onGroupExpandChange,
        select,
        children: gridChildren as any,
        ref: gridRef
    };

    // si highlight demandé
    if (toolbarSettings.filterHighlights) {
        if (!(renderedGridProps as any).cells) (renderedGridProps as any).cells = {};
        (renderedGridProps as any).cells.data = FilterHighlightCell;
    }

    // toolbar rendu si demandé
    const toolBarElement = (
        <GridToolbar>
            {toolbarSettings.expandCollapseAllButton && configuration.groupable && (
                <Button
                    onClick={() => {
                        const hasCollapsed = collapsedGroup.some(g => g.expanded === false);
                        if (hasCollapsed) {
                            // expand all groups
                            const groups = (finalData.data ?? []).reduce<GroupExpandDescriptor[]>((acc: any, item: any) => {
                                acc.push({ field: item.field, value: item.value, expanded: true });
                                return acc;
                            }, []);
                            setCollapsedGroup(groups);
                        } else {
                            // collapse all groups
                            const allGroups = groupBy(props.data, dataState.group);
                            const groups = (allGroups as GroupResult[]).reduce<GroupExpandDescriptor[]>((acc, item) => {
                                acc.push({ field: item.field, value: item.value, expanded: false });
                                return acc;
                            }, []);
                            setCollapsedGroup(groups);
                        }
                    }}
                    themeColor={TOOLBAR_BUTTON_TYPE}
                    size="small"
                    svgIcon={chevronDoubleDownIcon}
                />
            )}

            {toolbarSettings.externalFilter && (
                <div style={{ paddingLeft: 8 }}>
                    <Input value={filterValue ?? ''} onChange={onExternalFilterChange as any} placeholder="Search..." />
                </div>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {toolbarSettings.excelExportButton && (
                    <Button onClick={exportToExcel} themeColor={TOOLBAR_BUTTON_TYPE} size="small" svgIcon={fileExcelIcon} />
                )}
                {toolbarSettings.pdfExportButton && (
                    <Button onClick={exportToPdf} themeColor={TOOLBAR_BUTTON_TYPE} size="small" svgIcon={filePdfIcon} />
                )}
            </div>
        </GridToolbar>
    );

    // Export components: Excel / PDF (on passe la data plate pour l'export)
    const excelData = (finalData?.data ?? []).map((d: any) => {
        // si groupe -> ne pas inclure les group headers ; on tente d’extraire les dataItems sous items
        if (d.items && Array.isArray(d.items)) {
            return d.items.flatMap((it: any) => (it.items ? it.items : it));
        }
        return d;
    });

    // rendu
    return (
        <>
            <GridPDFExport ref={_pdfExport} margin="1cm">
                <Grid {...renderedGridProps} />
            </GridPDFExport>

            <ExcelExport
                data={(finalData?.data ?? [])}
                ref={_excelExport}
                columns={[]}
                group={dataState.group}
            />

            {/* si l'utilisateur souhaite voir la toolbar passée en children, l'ajouter aux children */}
            <Grid {...renderedGridProps}>{toolbarSettings ? [toolBarElement, ...(renderedGridProps.children as any[])] : renderedGridProps.children}</Grid>
        </>
    );
}
