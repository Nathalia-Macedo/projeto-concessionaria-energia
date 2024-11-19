import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const FormPreview = ({ formData }) => {
  const [selectedFormat, setSelectedFormat] = useState('excel');

  const renderExcelPreview = () => {
    if (!formData) return null;
    
    return (
      <div className="border rounded-lg p-4 bg-white overflow-auto max-h-[500px]">
        <table className="min-w-full">
          <tbody>
            {Object.entries(formData).map(([key, value]) => (
              <tr key={key} className="border-b">
                <td className="py-2 px-4 font-medium">{key}</td>
                <td className="py-2 px-4">{value?.v || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWordPreview = () => {
    if (!formData) return null;

    return (
      <div className="border rounded-lg p-4 bg-white font-serif space-y-2 max-h-[500px] overflow-auto">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="border-b pb-2">
            <span className="font-medium">{key}: </span>
            <span>{value?.v || ''}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleDownload = async () => {
    if (selectedFormat === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(
        Object.entries(formData).map(([key, value]) => ({
          Campo: key,
          Valor: value?.v || ''
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Formulário");
      XLSX.writeFile(wb, 'formulario.xlsx');
    } else if (selectedFormat === 'word') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: Object.entries(formData).map(([key, value]) => 
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formulario.docx';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <Tabs defaultValue="excel" onValueChange={setSelectedFormat}>
        <TabsList className="mb-4">
          <TabsTrigger value="excel">Excel</TabsTrigger>
          <TabsTrigger value="word">Word</TabsTrigger>
        </TabsList>
        
        <TabsContent value="excel">
          {renderExcelPreview()}
        </TabsContent>
        
        <TabsContent value="word">
          {renderWordPreview()}
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-end">
        <Button 
          onClick={handleDownload}
          className="bg-primary text-white hover:bg-primary/90"
        >
          Baixar {selectedFormat.toUpperCase()}
        </Button>
      </div>
    </Card>
  );
};

export default FormPreview;