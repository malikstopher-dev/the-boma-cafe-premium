'use client'

import { useState, useEffect, useRef } from 'react'
import { getAssetUrl, VALID_MODULES } from '@/lib/storage'
import type { MediaModule } from '@/lib/storage'

interface BrandAsset {
  id: string
  name: string
  type: string
  url?: string
  value?: string
  preview?: string
  category?: string
  tags: string[]
  bucket?: string
  storage_path?: string
  module?: string
  createdAt: string
  updatedAt: string
}

interface MediaPickerProps {
  module: MediaModule
  type: string
  value?: string
  onChange: (url: string) => void
  label?: string
}

type Tab = 'browse' | 'upload' | 'details'

export default function MediaPicker({ module, type, value, onChange, label }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('browse')
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ scope: 'assets', module })
      const res = await fetch(`/api/cms/marketing?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAssets(data)
      }
    } catch (e) {
      console.error('Failed to fetch assets:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      fetchAssets()
      setSelectedAsset(null)
      setTab('browse')
    }
  }, [open])

  const filteredAssets = assets.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('module', module)
      formData.append('type', type)
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''))
      const res = await fetch('/api/cms/marketing', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        await fetchAssets()
        setTab('browse')
      }
    } catch (e) {
      console.error('Upload failed:', e)
    }
    setUploading(false)
  }

  const handleDelete = async (asset: BrandAsset) => {
    if (!confirm(`Delete "${asset.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/cms/marketing?scope=asset&id=${asset.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== asset.id))
        if (selectedAsset?.id === asset.id) setSelectedAsset(null)
      }
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  const handleSelect = (asset: BrandAsset) => {
    const url = getAssetUrl(asset)
    onChange(url)
    setOpen(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      alert('URL copied to clipboard')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('URL copied to clipboard')
    }
  }

  const resolvedUrl = selectedAsset ? getAssetUrl(selectedAsset) : ''

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost"
        style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
      >
        📁 {label || 'Browse Media'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: '16px',
              width: '700px',
              maxWidth: '95vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--cream)',
            }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--dark-brown)', margin: 0 }}>
                Media Library — {module}
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-light)' }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '0',
              borderBottom: '2px solid var(--cream)',
              padding: '0 1.5rem',
            }}>
              {(['browse', 'upload'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); if (t === 'details') setSelectedAsset(null) }}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                    color: tab === t ? 'var(--primary)' : 'var(--text-light)',
                    fontWeight: tab === t ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textTransform: 'capitalize',
                    marginBottom: '-2px',
                  }}
                >
                  {t === 'browse' ? '📂 Browse' : '📤 Upload'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              {/* Browse Tab */}
              {tab === 'browse' && (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--cream)',
                        fontSize: '0.9rem',
                      }}
                    />
                    {type && (
                      <span style={{
                        padding: '0.4rem 0.75rem',
                        background: 'var(--cream)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-light)',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        {type}
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>Loading...</div>
                  ) : filteredAssets.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      background: 'var(--cream)',
                      borderRadius: '12px',
                      color: 'var(--text-light)',
                    }}>
                      {search ? 'No matching assets found.' : 'No assets yet. Upload one from the Upload tab.'}
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '0.75rem',
                    }}>
                      {filteredAssets.map(asset => {
                        const url = getAssetUrl(asset)
                        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) || asset.type !== 'font'
                        return (
                          <div
                            key={asset.id}
                            onClick={() => {
                              setSelectedAsset(asset)
                              setTab('details')
                            }}
                            style={{
                              background: 'var(--cream)',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: selectedAsset?.id === asset.id ? '2px solid var(--primary)' : '2px solid transparent',
                              transition: 'border-color 0.15s ease',
                            }}
                          >
                            <div style={{
                              height: '100px',
                              background: asset.type === 'color' ? asset.value || '#F5EDE3' : '#F5EDE3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                            }}>
                              {url && isImage ? (
                                <img
                                  src={url}
                                  alt={asset.name}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              ) : (
                                <span style={{ fontSize: '2rem', color: 'var(--text-light)' }}>
                                  {asset.type === 'font' ? 'Aa' : asset.type === 'video' ? '🎬' : '📄'}
                                </span>
                              )}
                              <span style={{
                                position: 'absolute',
                                top: '0.35rem',
                                left: '0.35rem',
                                background: 'rgba(0,0,0,0.55)',
                                color: '#fff',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                fontSize: '0.6rem',
                                textTransform: 'uppercase',
                              }}>
                                {asset.type}
                              </span>
                            </div>
                            <div style={{ padding: '0.5rem' }}>
                              <p style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: 'var(--dark-brown)',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {asset.name}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Tab */}
              {tab === 'upload' && (
                <div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                      border: '2px dashed var(--cream)',
                      borderRadius: '12px',
                      padding: '3rem 2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--cream)',
                      marginBottom: '1rem',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📤</div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                      {uploading ? 'Uploading...' : 'Drag & drop a file here, or click to browse'}
                    </p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      Images, videos, and PDFs up to 50MB
                    </p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Module: <strong>{module}</strong> | Type: <strong>{type}</strong>
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,application/pdf"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {uploading && (
                    <div style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'var(--primary)',
                      fontWeight: 600,
                    }}>
                      Uploading...
                    </div>
                  )}
                </div>
              )}

              {/* Details Tab */}
              {tab === 'details' && selectedAsset && (
                <div>
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: '200px',
                      height: '200px',
                      background: selectedAsset.type === 'color' ? selectedAsset.value || '#F5EDE3' : 'var(--cream)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {resolvedUrl && !(selectedAsset.type === 'color') ? (
                        <img
                          src={resolvedUrl}
                          alt={selectedAsset.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      ) : selectedAsset.type === 'color' ? (
                        <span style={{ color: '#fff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                          {selectedAsset.value}
                        </span>
                      ) : (
                        <span style={{ fontSize: '3rem', color: 'var(--text-light)' }}>📄</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--dark-brown)', marginBottom: '0.5rem' }}>
                        {selectedAsset.name}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                        <div><strong>Type:</strong> {selectedAsset.type}</div>
                        <div><strong>Module:</strong> {selectedAsset.module || '—'}</div>
                        {selectedAsset.storage_path && (
                          <div><strong>Path:</strong> {selectedAsset.storage_path}</div>
                        )}
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-all',
                        }}>
                          <strong>URL:</strong> {resolvedUrl}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleSelect(selectedAsset)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.85rem' }}
                        >
                          Select Asset
                        </button>
                        <button
                          onClick={() => handleCopyUrl(resolvedUrl)}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.85rem' }}
                        >
                          📋 Copy URL
                        </button>
                        <button
                          onClick={() => handleDelete(selectedAsset)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.75rem 1.5rem',
              borderTop: '1px solid var(--cream)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}>
              <button onClick={() => setOpen(false)} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
