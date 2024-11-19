// src/components/FormFiller.js
import React from 'react';
import { useFormContext } from '../Context/FormContext';
const FormFiller = () => {
  const { excelData, fieldMapping, setFilledForm } = useFormContext();

  const fillForm = () => {
    const filledData = excelData.map((row) =>
      Object.fromEntries(
        Object.entries(fieldMapping).map(([formField, excelField]) => [
          formField,
          row[excelField],
        ])
      )
    );

    setFilledForm(filledData);
    alert('Formulário preenchido com sucesso!');
  };

  return (
    <div>
      <h3>Preencher Formulário</h3>
      <button onClick={fillForm}>Preencher</button>
    </div>
  );
};

export default FormFiller;
