'use client';

import React, { useState, useRef } from 'react';
import { useImportExcel } from '../hooks/use-beneficiaries';
import { ImportReport, ImportLog } from '../types';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Database,
  BarChart3
} from 'lucide-react';

interface ImportExcelDialogProps {
  onClose: () => void;
}

export const ImportExcelDialog: React.FC<ImportExcelDialogProps> = ({ onClose }) => {
  const importExcelMutation = useImportExcel();
  
  // Drag and drop states
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Report states
  const [report, setReport] = useState<ImportReport | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setErrorText(null);
      } else {
        setErrorText('Invalid file format. Only Excel workbooks (.xlsx or .xls) are supported.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setErrorText(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setErrorText(null);
    try {
      const res = await importExcelMutation.mutateAsync(file);
      setReport(res);
    } catch (err: any) {
      setErrorText(err.message || 'Excel parsing failed.');
    }
  };

  const getLogLevelIcon = (level: ImportLog['level']) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />;
    }
  };

  const getLogLevelBg = (level: ImportLog['level']) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-50/50 border-red-100 text-red-900';
      case 'WARNING':
        return 'bg-amber-50/50 border-amber-100 text-amber-900';
      default:
        return 'bg-teal-50/50 border-teal-100 text-teal-900';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">
              Bulk Beneficiary Ingestion Engine
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!report ? (
            /* --- STEP 1: FILE LANDING TARGET --- */
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer ${
                  isDragActive 
                    ? 'border-teal-500 bg-teal-50/20' 
                    : file 
                      ? 'border-emerald-500 bg-emerald-50/10' 
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                
                {file ? (
                  <>
                    <FileSpreadsheet className="h-12 w-12 text-emerald-600 mb-3 animate-bounce" />
                    <h4 className="text-sm font-bold text-slate-800 truncate max-w-xs">{file.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-3 text-xs text-red-500 font-semibold hover:underline cursor-pointer"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-slate-400 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800">Drag & Drop Beneficiaries Roster</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Upload your Excel workbook. Each worksheet represents a **Region** with employees, spouses, and children.
                    </p>
                    <span className="mt-4 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 shadow-sm">
                      Browse Files
                    </span>
                  </>
                )}
              </div>

              {errorText && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                  {errorText}
                </div>
              )}

              {file && (
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={importExcelMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white bg-teal-600 hover:bg-teal-700 font-semibold text-sm transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {importExcelMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing excel workbook, resolving duplicates, generating report...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Ingest Roster Data
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* --- STEP 2: SUMMARY REPORTING DASHBOARD --- */
            <div className="space-y-6">
              {/* Alert state banner */}
              <div className={`p-4 border rounded-xl flex items-start gap-3 ${
                report.success 
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
                  : 'bg-red-50/50 border-red-200 text-red-950'
              }`}>
                {report.success ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {report.success 
                      ? 'Roster Ingested Successfully' 
                      : 'Roster Ingestion Failed'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {report.success 
                      ? 'The worksheet dataset has been parsed and synchronized safely. View the summary analytics below.'
                      : 'Critical errors occurred that prevented the ingestion engine from running safely.'}
                  </p>
                </div>
              </div>

              {/* Ingestion metrics cards */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" /> Ingestion Analytics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                    <span className="block text-xl font-bold text-slate-800">{report.summary.employees_created}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Employees Added</span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                    <span className="block text-xl font-bold text-slate-800">{report.summary.dependents_created}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Dependents Added</span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                    <span className="block text-xl font-bold text-slate-800">{report.summary.employees_updated}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Duplicates Linked</span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                    <span className="block text-xl font-bold text-red-600">{report.summary.errors_count}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Total Errors</span>
                  </div>
                </div>
              </div>

              {/* Line-by-line detailed logs */}
              {report.logs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Ingestion Parsing logs ({report.logs.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                    {report.logs.map((log, idx) => (
                      <div key={idx} className={`p-3 flex items-start gap-2.5 border-l-2 ${getLogLevelBg(log.level)}`}>
                        {getLogLevelIcon(log.level)}
                        <div className="leading-relaxed">
                          <span className="font-semibold mr-1.5">
                            [{log.sheet}{log.row ? ` (Row ${log.row})` : ''}]
                          </span>
                          {log.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          {report ? (
            <button
              type="button"
              onClick={() => { setReport(null); setFile(null); }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-semibold text-sm transition cursor-pointer"
            >
              Ingest Another File
            </button>
          ) : null}
          
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 font-semibold text-sm transition shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
