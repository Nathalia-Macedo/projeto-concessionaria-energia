// src/components/UploadManager.js
import React from 'react';
import * as XLSX from 'xlsx';
import { useFormContext } from '../Context/FormContext';
const UploadManager = () => {
  const { setExcelData, setFormTemplate } = useFormContext();

  const handleUpload = (e, type) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (type === 'excel') setExcelData(jsonData);
      if (type === 'form') setFormTemplate(sheet);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h3>Upload de Arquivos</h3>
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => handleUpload(e, 'excel')}
      />
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => handleUpload(e, 'form')}
      />
    </div>
  );
};

export default UploadManager;
