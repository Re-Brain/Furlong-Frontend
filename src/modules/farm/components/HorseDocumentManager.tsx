import { Upload, Trash2, FileText, ExternalLink, Loader2 } from 'lucide-react'
import { DOCUMENT_TYPES, type Horse } from '../api/horse'
import type { useHorseDocuments } from '../hooks/useHorseDocuments'

type HorseDocumentManagerProps = {
  horse: Horse
  documents: ReturnType<typeof useHorseDocuments>
  /** True when another section is being edited or an image action is in flight. */
  locked: boolean
}

// Proof-documents card: one row per required type, each either showing the
// uploaded file (view + delete) or an upload button. All state/async logic
// lives in the useHorseDocuments hook; this renders it.
function HorseDocumentManager({ horse, documents, locked }: HorseDocumentManagerProps) {
  const {
    uploadingType,
    deletingId,
    documentError,
    deleteConfirmId,
    setDeleteConfirmId,
    handleUpload,
    handleDelete,
    busy,
  } = documents

  const count = DOCUMENT_TYPES.filter(t => horse.documents?.some(d => d.document_type === t.key)).length

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-4 xs:p-6 flex flex-col gap-4">
      <p className="text-xs font-bold text-brand-muted uppercase">
        Proof Documents <span className="normal-case font-normal">({count}/3)</span>
      </p>
      <p className="text-[12px] text-brand-muted normal-case">
        All 3 are required before this horse can be submitted for review. Accepted: images or PDF, max 10MB per file.
      </p>
      {horse.status === 'approved' && (
        <p className="text-[12px] text-yellow-500 normal-case">
          Adding or removing a document will send this horse back for review.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {DOCUMENT_TYPES.map(({ key, label }) => {
          const doc = horse.documents?.find(d => d.document_type === key)
          return (
            <div
              key={key}
              className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 bg-brand-bg border border-brand-border rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-brand-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-text">{label}</p>
                  {doc && (
                    <p className="text-xs text-brand-muted truncate">
                      {doc.original_filename} &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {doc ? (
                deleteConfirmId === doc.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    {deletingId === doc.id ? (
                      <Loader2 size={16} className="text-brand-muted animate-spin" />
                    ) : (
                      <>
                        <span className="text-brand-muted text-xs">Delete?</span>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs font-bold text-brand-muted hover:text-brand-text"
                        >
                          No
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-gold px-3 py-1.5 rounded-lg border border-brand-border transition"
                    >
                      <ExternalLink size={13} /> View
                    </a>
                    {!locked && (
                      <button
                        onClick={() => setDeleteConfirmId(doc.id)}
                        className="text-brand-muted hover:text-red-700 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              ) : (
                <>
                  <label
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition shrink-0 ${
                      locked
                        ? 'bg-brand-gold/50 text-brand-bg cursor-not-allowed'
                        : 'bg-brand-gold text-brand-bg hover:bg-brand-gold-light cursor-pointer'
                    }`}
                    title={busy ? 'Wait for the current action to finish' : locked ? 'Finish editing first' : 'Upload document'}
                  >
                    <Upload size={13} /> {uploadingType === key ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={locked}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) handleUpload(key, file)
                      }}
                    />
                  </label>
                </>
              )}
            </div>
          )
        })}
      </div>

      {documentError && <p className="text-red-600 text-sm">{documentError}</p>}
    </div>
  )
}

export default HorseDocumentManager
