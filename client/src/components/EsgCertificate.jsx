import React from 'react';
import { X, Award, CheckCircle2, ShieldCheck, Download, Printer, QrCode } from 'lucide-react';

export default function EsgCertificate({ isOpen, onClose, deal }) {
  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border-8 border-emerald-900/10 p-8 sm:p-10 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Ornamental Border */}
        <div className="border-2 border-emerald-700/30 rounded-2xl p-6 sm:p-8 space-y-6 text-center relative bg-emerald-50/20">
          
          {/* Official Seal / Badge */}
          <div className="flex justify-between items-start">
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold block">
                SEBI BRSR / CPCB COMPLIANT
              </span>
              <span className="text-xs font-serif text-slate-500">Certificate No: BRSR-2026-IN-{deal.id}</span>
            </div>

            <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-100">
              <Award className="w-8 h-8" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Certificate of Circular Symbiosis
            </h2>
            <p className="text-xs uppercase tracking-widest text-emerald-800 font-semibold mt-1">
              Industrial Byproduct Transfer & Carbon Abatement Audit
            </p>
          </div>

          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            This is to formally certify that the following industrial entities have executed an authenticated circular resource exchange diverting post-industrial residuals from landfill deposit to authorized green feedstock conversion:
          </p>

          {/* Entity & Transaction Details */}
          <div className="grid grid-cols-2 gap-4 text-left bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Generator / Displacer:</span>
              <strong className="text-slate-900 text-sm block">{deal.supplierCompany}</strong>
              <span className="text-slate-500">{deal.supplierCity}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Beneficiary / Converter:</span>
              <strong className="text-slate-900 text-sm block">{deal.buyerCompany}</strong>
              <span className="text-slate-500">{deal.buyerCity}</span>
            </div>
          </div>

          {/* Audited Environmental Impact Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-emerald-900 text-white p-4 rounded-xl shadow-inner">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Material Diverted</span>
              <strong className="text-lg font-black">{deal.quantity} {deal.unit}</strong>
              <span className="text-[10px] text-emerald-300 block">{deal.material}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Net CO₂e Abated</span>
              <strong className="text-lg font-black text-emerald-300">{deal.co2AvoidedTons} MT</strong>
              <span className="text-[10px] text-emerald-300 block">Displaced Virgin Ore</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Water Conserved</span>
              <strong className="text-lg font-black">{(deal.waterSavedLitres / 1000).toLocaleString('en-IN')} kL</strong>
              <span className="text-[10px] text-emerald-300 block">Industrial Freshwater</span>
            </div>
          </div>

          {/* Signatures & Verification */}
          <div className="pt-4 border-t border-emerald-100 flex items-center justify-between text-left text-xs">
            <div>
              <div className="font-mono text-[11px] text-slate-600">
                Gate Pass: <strong>{deal.gatePassNumber}</strong>
              </div>
              <div className="font-mono text-[11px] text-slate-600">
                Weighbridge: <strong>{deal.weighbridgeSlip}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Digitally Verified by</span>
                <span className="font-bold text-emerald-800">Phenix Symbiosis Registry</span>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-700" />
            </div>
          </div>

        </div>

        {/* Certificate Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Compliance Certificate</span>
          </button>
        </div>

      </div>
    </div>
  );
}
