import React, { useState, useMemo, useRef } from 'react';
import { Grid, GridColumn, GridDataStateChangeEvent, GridColumnMenuFilter, GridColumnMenuCheckboxFilter, GridColumnMenuProps } from '@progress/kendo-react-grid';
import { GroupResult, process, State } from '@progress/kendo-data-query';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import { filterIcon } from '@progress/kendo-svg-icons';

// Données d'exemple
interface Product {
  ProductID: number;
  ProductName: string;
  Category: string;
  Price: number;
}

const initialData: Product[] = [
  { ProductID: 1, ProductName: 'Apple', Category: 'Fruit', Price: 1.2 },
  { ProductID: 2, ProductName: 'Banana', Category: 'Fruit', Price: 0.8 },
  { ProductID: 3, ProductName: 'Carrot', Category: 'Vegetable', Price: 0.5 },
  { ProductID: 4, ProductName: 'Broccoli', Category: 'Vegetable', Price: 1.0 },
  { ProductID: 5, ProductName: 'Cucumber', Category: 'Vegetable', Price: 0.9 },
  { ProductID: 6, ProductName: 'Orange', Category: 'Fruit', Price: 1.4 },
  { ProductID: 7, ProductName: 'Grapes', Category: 'Fruit', Price: 2.0 },
  { ProductID: 8, ProductName: 'Lettuce', Category: 'Vegetable', Price: 0.7 },
  { ProductID: 9, ProductName: 'Peach', Category: 'Fruit', Price: 1.5 },
  { ProductID: 10, ProductName: 'Spinach', Category: 'Vegetable', Price: 1.2 },
  { ProductID: 11, ProductName: 'Strawberry', Category: 'Fruit', Price: 2.5 },
  { ProductID: 12, ProductName: 'Potato', Category: 'Vegetable', Price: 0.4 },
  { ProductID: 13, ProductName: 'Mango', Category: 'Fruit', Price: 2.3 },
  { ProductID: 14, ProductName: 'Tomato', Category: 'Vegetable', Price: 1.1 },
  { ProductID: 15, ProductName: 'Pineapple', Category: 'Fruit', Price: 3.0 },
  { ProductID: 16, ProductName: 'Zucchini', Category: 'Vegetable', Price: 1.0 },
  { ProductID: 17, ProductName: 'Watermelon', Category: 'Fruit', Price: 4.0 },
  { ProductID: 18, ProductName: 'Asparagus', Category: 'Vegetable', Price: 2.2 },
  { ProductID: 19, ProductName: 'Blueberry', Category: 'Fruit', Price: 3.5 },
  { ProductID: 20, ProductName: 'Cauliflower', Category: 'Vegetable', Price: 1.7 },
  { ProductID: 21, ProductName: 'Barres protéinées aux amandes et miel', Category: 'Snacking Santé', Price: 1.90 },
  { ProductID: 22, ProductName: 'Chips de pois chiches épicées', Category: 'Snacking Santé', Price: 2.30 },
  { ProductID: 23, ProductName: 'Mélange de noix bio salées', Category: 'Snacking Santé', Price: 3.50 },
  { ProductID: 24, ProductName: 'Bâtonnets de céleri au houmous léger', Category: 'Snacking Santé', Price: 2.10 },
  { ProductID: 25, ProductName: 'Boules d énergie dattes-cacao', Category: 'Snacking Santé', Price: 2.80 },
  { ProductID: 26, ProductName: 'Eau pétillante infusée au concombre', Category: 'Boissons Fonctionnelles', Price: 1.50 },
  { ProductID: 27, ProductName: 'Kombucha gingembre-citron 330ml', Category: 'Boissons Fonctionnelles', Price: 2.40 },
  { ProductID: 28, ProductName: 'Smoothie vert détox prêt à boire', Category: 'Boissons Fonctionnelles', Price: 3.20 },
  { ProductID: 29, ProductName: 'Boisson électrolyte à la pastèque', Category: 'Boissons Fonctionnelles', Price: 2.10 },
  { ProductID: 30, ProductName: 'Thé froid adaptogène au ginseng', Category: 'Boissons Fonctionnelles', Price: 2.60 },
  { ProductID: 31, ProductName: 'Lasagnes végétariennes aux lentilles', Category: 'Plats Prêts Végétariens', Price: 5.90 },
  { ProductID: 32, ProductName: 'Curry pois chiches et patate douce', Category: 'Plats Prêts Végétariens', Price: 6.20 },
  { ProductID: 33, ProductName: 'Boulettes quinoa et légumes', Category: 'Plats Prêts Végétariens', Price: 5.50 },
  { ProductID: 34, ProductName: 'Risotto crémeux aux champignons', Category: 'Plats Prêts Végétariens', Price: 6.00 },
  { ProductID: 35, ProductName: 'Tacos végétariens au jackfruit', Category: 'Plats Prêts Végétariens', Price: 5.80 },
  { ProductID: 36, ProductName: 'Wrap protéiné tofu-avocat', Category: 'Plats Prêts Végétariens', Price: 4.50 },
  { ProductID: 37, ProductName: 'Porridge instantané avoine-fruits rouges', Category: 'Snacking Santé', Price: 1.70 },
  { ProductID: 38, ProductName: 'Lait végétal enrichi amande-noisette', Category: 'Boissons Fonctionnelles', Price: 2.90 },
  { ProductID: 39, ProductName: 'Gratin courgettes et tofu fumé', Category: 'Plats Prêts Végétariens', Price: 5.60 },
  { ProductID: 40, ProductName: 'Barres de céréales sans sucre ajouté', Category: 'Snacking Santé', Price: 1.80 }
];

// Déclarez un type local pour l'état de la grille

export const ColumnMenu = (props: GridColumnMenuProps) => {
    return (
        <div>
            <GridColumnMenuFilter {...props} expanded={true} />
        </div>
    );
};

export const ColumnMenuCheckboxFilter = (props: GridColumnMenuProps) => {
    return (
        <div>
            <GridColumnMenuCheckboxFilter {...props} data={initialData} expanded={true} />
        </div>
    );
};

/**
 * type guard : indique si data est un tableau de GroupResult
 */
const isGroupArray = (data: Product[] | GroupResult[]): data is GroupResult[] => {
  return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'items' in data[0];
};

const flattenGroupedData = (data: Product[] | GroupResult[]): Product[] => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  if (isGroupArray(data)) {
    return data.flatMap(group => flattenGroupedData(group.items as Product[] | GroupResult[]));
  }

  return data as Product[];
};

const GridTestPage: React.FC = () => {
  const [dataState, setDataState] = useState<State>({
    skip: 0,
    take: 5,
    sort: [],
    filter: undefined,
    group: [],
  });

  const excelExportRef = useRef<ExcelExport | null>(null);

  // Si group est actif, on force skip=0 et take=all pour le rendu de la grille
  const gridStateForRender = useMemo(() => {
    if (dataState.group && dataState.group.length > 0) {
      return { ...dataState, skip: 0, take: initialData.length };
    }
    return dataState;
  }, [dataState]);

  const processedData = useMemo(() => {
    return process(initialData, gridStateForRender);
  }, [gridStateForRender]);

  // Export : toujours toutes les lignes filtrées/triées/groupées (sans pagination)
  const exportData = useMemo(() => {
    const fullState: State = {
      ...dataState,
      skip: 0,
      take: initialData.length,
    };
    return process(initialData, fullState).data;
  }, [dataState]);

  ///
  // Aplatir les groupes pour obtenir Product[]
  const exportFlatData = useMemo(() => flattenGroupedData(exportData), [exportData]);
  const handleExport = () => {
    if (!excelExportRef.current) return;
    // debug : vérifier les données avant export
    console.log('exportFlatData', exportFlatData);
    // Passe explicitement les données à save pour forcer l'export
    excelExportRef.current.save(exportFlatData);
   };

   // Définition des colonnes pour ExcelExport via la prop `columns`
   const excelColumns = [
     { field: 'ProductID', title: 'ID' },
     { field: 'ProductName', title: 'Product Name' },
     { field: 'Category', title: 'Category' },
     { field: 'Price', title: 'Price', format: '#,##0.00' },
    ];
  ///

  /*const handleExport = () => {
    if (excelExportRef.current) {
      excelExportRef.current.save();
    }
  };*/

  const onDataStateChange = (event: GridDataStateChangeEvent) => {
    setDataState(event.dataState);
  };

  return (
    <div>
      <div className="toolbar">
        <button className="k-button" onClick={handleExport}>
          Export to Excel
        </button>
      </div>

      <ExcelExport data={exportData} ref={excelExportRef} fileName="Product_List.xlsx" columns={excelColumns} />

      <Grid
        data={processedData.data}
        total={processedData.total}
        skip={gridStateForRender.skip}
        take={gridStateForRender.take}
        pageable={!(dataState.group && dataState.group.length > 0) ? { buttonCount: 7, info: true, pageSizes: [5, 10, 50] } : false} // pagination désactivée si groupé
        sortable={true}
        //filterable={true}
        autoProcessData={true}
        dataItemKey="ProductID"
        groupable={true}
        onDataStateChange={onDataStateChange}
        columnMenuIcon={filterIcon}
      >
        <GridColumn field="ProductID" title="ID" filter={'numeric'} columnMenu={ColumnMenu} />
        <GridColumn field="ProductName" title="Product Name" filter={'text'} columnMenu={ColumnMenuCheckboxFilter} />
        <GridColumn field="Category" title="Category" filter={'text'} columnMenu={ColumnMenuCheckboxFilter} />
        <GridColumn field="Price" title="Price" filter={'numeric'} columnMenu={ColumnMenu} />
      </Grid>
    </div>
  );
};

export default GridTestPage;


