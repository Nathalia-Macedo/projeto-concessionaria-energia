// src/components/FileExporter.js
import React from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useFormContext } from '../Context/FormContext';
const FileExporter = () => {
  const { filledForm } = useFormContext();

  const exportAsPDF = () => {
    const doc = new jsPDF();
    filledForm.forEach((row, idx) => {
      doc.text(JSON.stringify(row), 10, 10 + idx * 10);
    });
    doc.save('formulario.pdf');
  };

  const exportAsExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filledForm);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Formulário');
    XLSX.writeFile(workbook, 'formulario.xlsx');
  };

  return (
    <div>
      <h3>Exportar Formulário</h3>
      <button onClick={exportAsPDF}>Exportar como PDF</button>
      <button onClick={exportAsExcel}>Exportar como Excel</button>
    </div>
  );
};

export default FileExporter;
