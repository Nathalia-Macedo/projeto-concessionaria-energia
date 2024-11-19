// src/context/FormContext.js
import React, { createContext, useState, useContext } from 'react';

const FormContext = createContext();

export const FormProvider = ({ children }) => {
  const [excelData, setExcelData] = useState(null); // Dados da tabela Excel
  const [formTemplate, setFormTemplate] = useState(null); // Template do formulário
  const [fieldMapping, setFieldMapping] = useState({}); // Mapeamento de campos
  const [filledForm, setFilledForm] = useState(null); // Formulário preenchido

  return (
    <FormContext.Provider
      value={{
        excelData,
        setExcelData,
        formTemplate,
        setFormTemplate,
        fieldMapping,
        setFieldMapping,
        filledForm,
        setFilledForm,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => useContext(FormContext);
