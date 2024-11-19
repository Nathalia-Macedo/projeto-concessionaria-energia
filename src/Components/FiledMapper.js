// src/components/FieldMapper.js
import React, { useState } from 'react';
import { useFormContext } from '../Context/FormContext';

const FieldMapper = () => {
  const { excelData, formTemplate, setFieldMapping } = useFormContext();
  const [localMapping, setLocalMapping] = useState({});

 

  return (
    <div>
      <h3>Mapeamento de Campos</h3>
      {formTemplate && (
        <ul>
          {Object.keys(formTemplate).map((field) => (
            <li key={field}>
              <label>{field}:</label>
              <select
                onChange={(e) => handleFieldMapping(field, e.target.value)}
              >
                <option value="">Selecione um campo</option>
                {excelData &&
                  Object.keys(excelData[0]).map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
              </select>
            </li>
          ))}
        </ul>
      )}
      <button onClick={saveMapping}>Salvar Mapeamento</button>
    </div>
  );
};

export default FieldMapper;
