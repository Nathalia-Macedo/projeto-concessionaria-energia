import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function FormProcessor() {
  const [excelData, setExcelData] = useState(null);
  const [formTemplate, setFormTemplate] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [filledForm, setFilledForm] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [previewType, setPreviewType] = useState('field-value');

  useEffect(() => {
    console.log('Dados do Excel:', excelData);
    console.log('Template do formulário:', formTemplate);
    console.log('Mapeamento de campos:', fieldMapping);
    console.log('Formulário preenchido:', filledForm);
  }, [excelData, formTemplate, fieldMapping, filledForm]);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setExcelData(jsonData);
      console.log('Dados do Excel carregados:', jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      setFormTemplate(sheet);
      console.log('Template do formulário carregado:', sheet);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFieldMapping = () => {
    console.log('Iniciando mapeamento de campos');
    if (!excelData || !formTemplate) {
      console.log('Dados do Excel ou template do formulário ausentes');
      return;
    }

    const mapping = {};
    const formFields = Object.keys(formTemplate).filter(key => {
      const match = key.match(/^([A-Z]+)(\d+)$/);
      return match && formTemplate[key]?.v;
    });
    
    const excelFields = Object.keys(excelData[0]);

    console.log('Campos do formulário encontrados:', formFields);
    console.log('Campos do Excel disponíveis:', excelFields);

    formFields.forEach(formField => {
      const cellValue = formTemplate[formField]?.v;
      console.log(`Analisando campo ${formField} com valor: ${cellValue}`);

      if (cellValue && typeof cellValue === 'string') {
        const matchingExcelField = excelFields.find(excelField => {
          const excelValue = excelData[0][excelField];
          if (!excelValue) return false;
          
          return (
            cellValue.toLowerCase().includes(excelField.toLowerCase()) ||
            excelField.toLowerCase().includes(cellValue.toLowerCase()) ||
            (typeof excelValue === 'string' && 
             (excelValue.toLowerCase().includes(cellValue.toLowerCase()) ||
              cellValue.toLowerCase().includes(excelValue.toLowerCase())))
          );
        });

        if (matchingExcelField) {
          mapping[formField] = matchingExcelField;
          console.log(`✓ Mapeado: ${formField} -> ${matchingExcelField}`);
        } else {
          console.log(`✗ Não encontrado mapeamento para: ${formField}`);
        }
      }
    });

    console.log('Mapeamento final:', mapping);
    if (Object.keys(mapping).length === 0) {
      console.log('Aviso: Nenhum campo foi mapeado automaticamente');
      alert('Nenhum campo foi mapeado automaticamente. Verifique se os dados do Excel correspondem aos campos do formulário.');
    } else {
      setFieldMapping(mapping);
      alert(`${Object.keys(mapping).length} campos foram mapeados com sucesso!`);
    }
  };

  const fillForm = () => {
    if (!excelData || !formTemplate || !fieldMapping) {
      console.log('Dados ausentes para preenchimento do formulário');
      return;
    }

    const filledSheet = { ...formTemplate };
    Object.entries(fieldMapping).forEach(([formField, excelField]) => {
      if (excelData[0][excelField]) {
        filledSheet[formField] = { ...filledSheet[formField], v: excelData[0][excelField] };
        console.log(`Campo preenchido: ${formField} com valor: ${excelData[0][excelField]}`);
      }
    });

    setFilledForm(filledSheet);
    console.log('Formulário preenchido:', filledSheet);
  };

  const renderFieldValuePreview = () => {
    if (!filledForm) return null;
    
    const tableData = Object.entries(filledForm).map(([key, value]) => {
      const match = key.match(/([A-Z]+)(\d+)/);
      const [column, row] = match ? match.slice(1) : [key, ''];
      return {
        ref: key,
        column: column,
        value: value.v || ''
      };
    });
  
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 overflow-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coluna</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.ref}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.ref}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.column}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };



  
  const renderPDFPreview = () => {
    if (!filledForm) return null;

    return (
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-4 max-h-[500px] overflow-auto font-mono text-sm">
        <pre className="whitespace-pre-wrap">
          {`UTM
2.1 MODALIDADE(Se autoconsumo remoto, clicar no botão + a esquerda)
3.1 TIPO DE CONEXÃO3.2 TIPO DE RAMAL
3.5 TIPO
3.11 OBSERVAÇÃO
4. Dados Módulos
4.2 MODELO
4.4 POTÊNCIA (Wp)4.5 POTÊNCIA TOTAL (kWp)
(Se mais de um modelo de módulo, clicar no botão + a esquerda)
INVERSOR 1 /  AGRUPAMENTO
5.2 NÚMERO DE FASES
5.3 TENSÃO CONEXÃO
5.5 QUANTIDADE INVERSORES5.6 POTENCIA TOTAL (kW)
5.8 MPPTs
5.11 QTDE. DE SÉRIES
5.16 Potência (W)
5.21 Potência (W)
5.22 SÉRIE 35.26 Potência (W)
5.15 Vcco(V)
5.20 Vcco(V)
5.25 Vcco(V)
5.4 POTÊNCIA INVERSOR (kW)
${filledForm['A1']?.v || '0'}
${filledForm['B1']?.v || '0'}
${filledForm['C1']?.v || 'NÃO ENCONTRADO'}5.9 SÉRIE POR MPPT${filledForm['D1']?.v || 'NÃO ENCONTRADO'}
${filledForm['E1']?.v || '#VALOR!'}
${filledForm['F1']?.v || '#VALOR!'}
4.6 Isc (A)${filledForm['G1']?.v || 'NÃO ENCONTRADO'}4.7 Vcco (V)${filledForm['H1']?.v || 'NÃO ENCONTRADO'}
${filledForm['I1']?.v || '#VALOR!'}${filledForm['J1']?.v || '0'}
5.12 SÉRIE 15.13 N° MÓDULOS
5. Dados do Inversor/Agrupamento
4.8 ALTURA (mm)
5.7 MODELO${filledForm['K1']?.v || 'NÃO ENCONTRADO'}
${filledForm['L1']?.v || 'NÃO ENCONTRADO'}4.9 LARGURA (mm)${filledForm['M1']?.v || 'NÃO ENCONTRADO'}4.10 ÁREA (m²)${filledForm['N1']?.v || '0'}
4.11 OBSERVAÇÃO
${filledForm['O1']?.v || '0,00'}
3.4 DISJUNTOR 
3. Dados do Padrão
3.3 TENSÃO
3.6 CARGA ${filledForm['P1']?.v || '0,0'}
3.9 TIPO DE SOLICITAÇÃO
3.10 DISJUNTOR ANTERIOR
${filledForm['Q1']?.v || 'NÃO ENCONTRADO'}4.1 FABRICANTE
3.7 FASE/NEUTRO
Integral Energia 
Formulário do Cliente
PROJETO
X
INTEGRADOR:
E-MAIL:
(31) 98020-9744
Y
${filledForm['R1']?.v || '0'}CONCESSIONÁRIA
${filledForm['S1']?.v || 'CLIENTE'}${filledForm['T1']?.v || 'INTEGRALENERGIA@GMAIL.COM'}TELEFONE:
1. Dados do Cliente
1.1 NUMERO DO CLIENTE
${filledForm['U1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.2 NUMERO DA INSTALAÇÃO
${filledForm['V1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.3 TITULAR DA UC
1.4 CPF / CNPJ
${filledForm['W1']?.v || 'DE ACORDO COM O ID DO CLIENTE'}
5.23 N° MÓDULOS
5.1 FABRICANTE
5.10 MÓDULOS POR SÉRIE
${filledForm['X1']?.v || '0'}
LOCALIZAÇÃO
1.15 GRUPO
3.8 TERRA
${filledForm['Y1']?.v || 'Autoconsumo Remoto'}
${filledForm['Z1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.14 COMPLEMENTO
1.17 CLASSE
2. Modalidade de compensação
1.20 Área
1.23 Abscissa (X)
1.18 Latitude 
1.21 Longitude
${filledForm['AA1']?.v || 'DE ACORDO COM O ID DO CLIENTE'}
${filledForm['AB1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
5.17 SÉRIE 25.18 N° MÓDULOS
${filledForm['AC1']?.v || 'NÃO ENCONTRADO'}
4.3 QUANTIDADE
${filledForm['AD1']?.v || 'NÃO ENCONTRADO'}
1.12 CEP
${filledForm['AE1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.13 ESTADO
${filledForm['AF1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.24 Ordenada (Y)
1.8 ENDEREÇO
${filledForm['AG1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.9 NÚMERO
${filledForm['AH1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.10 BAIRRO
${filledForm['AI1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.11 MUNICIPIO
http://splink.cria.org.br/conversor
Graus Decimais (usar vírgula)Grau, minuto, segundo
1.19 Latitude
1.22 Longitude
1.16 SUBGRUPO

5.30 Potência (W)
5.33 Imax ca (A)
5.35 Terra (mm²)5.36 Disjuntor 
5.37 OBSERVAÇÃO
(Se mais de um modelo de inversor ou agrupamento, clicar no botão + a esquerda)
(Se mais de um modelo de inversor ou agrupamento, clicar no botão + a esquerda)
5.38 POTENCIA TOTAL DE INVERSORES (kW)5.39 QUANTIDADE TOTAL DE INVERSORES
5.40 POTÊNCIA TOTAL DOS MÓDULOS (kWp)5.41 QUANTIDADE TOTAL DE MÓDULOS
5.42 POTÊNCIA DO SISTEMA (kW)5.43 AREA TOTAL DOS MODULOS
5.29 Vcco(V)
Nota: Recomendado no caso de mais de um inversor/agrupamento para ligação nova. 
No caso de ampliação de sistema, não usar geral e fazer circuito independente do sistema já instalado
6.1 Condutor CA (mm²)6.2 Terra (mm²)6.3 Disjuntor 
${filledForm['AJ1']?.v || '0'}${filledForm['AK1']?.v || '0,00'}
${filledForm['AL1']?.v || '0'}
${filledForm['AM1']?.v || '0,00'}
6. Proteção Geral
${filledForm['AN1']?.v || '0'}
${filledForm['AO1']?.v || '0'}
5.34 Condutor CA (mm²)
${filledForm['AP1']?.v || 'NÃO ENCONTRADO'}
${filledForm['AQ1']?.v || '0'}
5.31 TENSÃO MÁXIMA (V)${filledForm['AR1']?.v || 'NÃO ENCONTRADO'}5.32 Imax cc (A)${filledForm['AS1']?.v || 'NÃO ENCONTRADO'}
${filledForm['AT1']?.v || '#VALOR!'}5.26 N° MÓDULOS5.27 SÉRIE 4

MUDAR DE ACORDO COM CONCESSIONÁRIA
1.3.1, 1.4.1, 1.4.2 SÓ APARECEM PARA EQUATORIAL
NOTA SOBRE A CARGA SE NEOENERGIA E CAIXA SE CEMIG
NOTA SOBRE CONEXÃO
COLOCAR $$ NAS CASAS REFERENTES AO PADRÃO PARA COPIAR PARA O SEGUNDO AGRUPAMENTO`}
        </pre>
      </div>
    );
  };

  const handleDownload = async () => {
    if (!filledForm) {
      console.log('Nenhum formulário preenchido para download');
      return;
    }

    if (selectedFormat === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(
        Object.entries(filledForm).map(([key, value]) => ({
          Campo: key,
          Valor: value?.v || ''
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Formulário");
      XLSX.writeFile(wb, 'formulario.xlsx');
      console.log('Arquivo Excel baixado');
    } else if (selectedFormat === 'word') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: Object.entries(filledForm).map(([key, value]) => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `${key}: ${value?.v || ''}`,
                  size: 24
                })
              ]
            })
          )
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'formulario.docx');
      console.log('Arquivo Word baixado');
    } else if (selectedFormat === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 10;
      const font = await pdfDoc.embedFont(StandardFonts.Courier);

      let yOffset = height - 50;
      const content = `UTM
2.1 MODALIDADE(Se autoconsumo remoto, clicar no botão + a esquerda)
3.1 TIPO DE CONEXÃO3.2 TIPO DE RAMAL
3.5 TIPO
3.11 OBSERVAÇÃO
4. Dados Módulos
4.2 MODELO
4.4 POTÊNCIA (Wp)4.5 POTÊNCIA TOTAL (kWp)
(Se mais de um modelo de módulo, clicar no botão + a esquerda)
INVERSOR 1 /  AGRUPAMENTO
5.2 NÚMERO DE FASES
5.3 TENSÃO CONEXÃO
5.5 QUANTIDADE INVERSORES5.6 POTENCIA TOTAL (kW)
5.8 MPPTs
5.11 QTDE. DE SÉRIES
5.16 Potência (W)
5.21 Potência (W)
5.22 SÉRIE 35.26 Potência (W)
5.15 Vcco(V)
5.20 Vcco(V)
5.25 Vcco(V)
5.4 POTÊNCIA INVERSOR (kW)
${filledForm['A1']?.v || '0'}
${filledForm['B1']?.v || '0'}
${filledForm['C1']?.v || 'NÃO ENCONTRADO'}5.9 SÉRIE POR MPPT${filledForm['D1']?.v || 'NÃO ENCONTRADO'}
${filledForm['E1']?.v || '#VALOR!'}
${filledForm['F1']?.v || '#VALOR!'}
4.6 Isc (A)${filledForm['G1']?.v || 'NÃO ENCONTRADO'}4.7 Vcco (V)${filledForm['H1']?.v || 'NÃO ENCONTRADO'}
${filledForm['I1']?.v || '#VALOR!'}${filledForm['J1']?.v || '0'}
5.12 SÉRIE 15.13 N° MÓDULOS
5. Dados do Inversor/Agrupamento
4.8 ALTURA (mm)
5.7 MODELO${filledForm['K1']?.v || 'NÃO ENCONTRADO'}
${filledForm['L1']?.v || 'NÃO ENCONTRADO'}4.9 LARGURA (mm)${filledForm['M1']?.v || 'NÃO ENCONTRADO'}4.10 ÁREA (m²)${filledForm['N1']?.v || '0'}
4.11 OBSERVAÇÃO
${filledForm['O1']?.v || '0,00'}
3.4 DISJUNTOR 
3. Dados do Padrão
3.3 TENSÃO
3.6 CARGA ${filledForm['P1']?.v || '0,0'}
3.9 TIPO DE SOLICITAÇÃO
3.10 DISJUNTOR ANTERIOR
${filledForm['Q1']?.v || 'NÃO ENCONTRADO'}4.1 FABRICANTE
3.7 FASE/NEUTRO
Integral Energia 
Formulário do Cliente
PROJETO
X
INTEGRADOR:
E-MAIL:
(31) 98020-9744
Y
${filledForm['R1']?.v || '0'}CONCESSIONÁRIA
${filledForm['S1']?.v || 'CLIENTE'}${filledForm['T1']?.v || 'INTEGRALENERGIA@GMAIL.COM'}TELEFONE:
1. Dados do Cliente
1.1 NUMERO DO CLIENTE
${filledForm['U1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.2 NUMERO DA INSTALAÇÃO
${filledForm['V1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.3 TITULAR DA UC
1.4 CPF / CNPJ
${filledForm['W1']?.v || 'DE ACORDO COM O ID DO CLIENTE'}
5.23 N° MÓDULOS
5.1 FABRICANTE
5.10 MÓDULOS POR SÉRIE
${filledForm['X1']?.v || '0'}
LOCALIZAÇÃO
1.15 GRUPO
3.8 TERRA
${filledForm['Y1']?.v || 'Autoconsumo Remoto'}
${filledForm['Z1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.14 COMPLEMENTO
1.17 CLASSE
2. Modalidade de compensação
1.20 Área
1.23 Abscissa (X)
1.18 Latitude 
1.21 Longitude
${filledForm['AA1']?.v || 'DE ACORDO COM O ID DO CLIENTE'}
${filledForm['AB1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
5.17 SÉRIE 25.18 N° MÓDULOS
${filledForm['AC1']?.v || 'NÃO ENCONTRADO'}
4.3 QUANTIDADE
${filledForm['AD1']?.v || 'NÃO ENCONTRADO'}
1.12 CEP
${filledForm['AE1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.13 ESTADO
${filledForm['AF1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.24 Ordenada (Y)
1.8 ENDEREÇO
${filledForm['AG1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.9 NÚMERO
${filledForm['AH1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.10 BAIRRO
${filledForm['AI1']?.v || 'DE ACORDO COM A CONTA DE ENERGIA DO CLIENTE'}
1.11 MUNICIPIO
http://splink.cria.org.br/conversor
Graus Decimais (usar vírgula)Grau, minuto, segundo
1.19 Latitude
1.22 Longitude
1.16 SUBGRUPO

5.30 Potência (W)
5.33 Imax ca (A)
5.35 Terra (mm²)5.36 Disjuntor 
5.37 OBSERVAÇÃO
(Se mais de um modelo de inversor ou agrupamento, clicar no botão + a esquerda)
(Se mais de um modelo de inversor ou agrupamento, clicar no botão + a esquerda)
5.38 POTENCIA TOTAL DE INVERSORES (kW)5.39 QUANTIDADE TOTAL DE INVERSORES
5.40 POTÊNCIA TOTAL DOS MÓDULOS (kWp)5.41 QUANTIDADE TOTAL DE MÓDULOS
5.42 POTÊNCIA DO SISTEMA (kW)5.43 AREA TOTAL DOS MODULOS
5.29 Vcco(V)
Nota: Recomendado no caso de mais de um inversor/agrupamento para ligação nova. 
No caso de ampliação de sistema, não usar geral e fazer circuito independente do sistema já instalado
6.1 Condutor CA (mm²)6.2 Terra (mm²)6.3 Disjuntor 
${filledForm['AJ1']?.v || '0'}${filledForm['AK1']?.v || '0,00'}
${filledForm['AL1']?.v || '0'}
${filledForm['AM1']?.v || '0,00'}
6. Proteção Geral
${filledForm['AN1']?.v || '0'}
${filledForm['AO1']?.v || '0'}
5.34 Condutor CA (mm²)
${filledForm['AP1']?.v ||'NÃO ENCONTRADO'}
${filledForm['AQ1']?.v || '0'}
5.31 TENSÃO MÁXIMA (V)${filledForm['AR1']?.v || 'NÃO ENCONTRADO'}5.32 Imax cc (A)${filledForm['AS1']?.v || 'NÃO ENCONTRADO'}
${filledForm['AT1']?.v || '#VALOR!'}5.26 N° MÓDULOS5.27 SÉRIE 4

MUDAR DE ACORDO COM CONCESSIONÁRIA
1.3.1, 1.4.1, 1.4.2 SÓ APARECEM PARA EQUATORIAL
NOTA SOBRE A CARGA SE NEOENERGIA E CAIXA SE CEMIG
NOTA SOBRE CONEXÃO
COLOCAR $$ NAS CASAS REFERENTES AO PADRÃO PARA COPIAR PARA O SEGUNDO AGRUPAMENTO`;

      const lines = content.split('\n');
      lines.forEach((line) => {
        page.drawText(line, {
          x: 50,
          y: yOffset,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        yOffset -= fontSize + 2;
        if (yOffset < 50) {
          const newPage = pdfDoc.addPage();
          yOffset = newPage.getSize().height - 50;
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'formulario.pdf');
      console.log('Arquivo PDF baixado');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Processador de Formulário Excel</h1>
      
      <div className="mb-8 bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">1. Upload de Arquivos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Dados Excel:</label>
            <input type="file" onChange={handleExcelUpload} accept=".xlsx, .xls" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Template do Formulário:</label>
            <input type="file" onChange={handleTemplateUpload} accept=".xlsx, .xls" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>
        </div>
      </div>

      {excelData && formTemplate && (
        <div className="mb-8 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">2. Mapeamento de Campos</h2>
          <button onClick={handleFieldMapping} className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
            Mapear Campos Automaticamente
          </button>
        </div>
      )}

      {Object.keys(fieldMapping).length > 0 && (
        <div className="mb-8 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">3. Preencher Formulário</h2>
          <button onClick={fillForm} className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">
            Preencher Formulário
          </button>
        </div>
      )}

      {filledForm && (
        <div className="mb-8 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">4. Prévia e Download do Formulário</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Formato de Visualização:</label>
            <select 
              value={previewType} 
              onChange={(e) => setPreviewType(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="field-value">Campo - Valor</option>
              <option value="pdf-format">Formato PDF</option>
            </select>
          </div>
          {previewType === 'field-value' ? renderFieldValuePreview() : renderPDFPreview()}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Formato de Download:</label>
            <select 
              value={selectedFormat} 
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="excel">Excel</option>
              <option value="word">Word</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div className="mt-6">
            <button 
              onClick={handleDownload}
              className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition duration-300"
            >
              Baixar {selectedFormat.toUpperCase()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}