'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from './AppShell'
import { authFetch, getApiUrl } from '@/lib/utils'

interface Props {
  userName: string
  isAdmin?: boolean
}

function getRatingNumber(stars: string): string {
  if (!stars) return ''
  const clean = stars.trim()
  if (clean === '⭐') return '1'
  if (clean === '⭐⭐') return '2'
  if (clean === '⭐⭐⭐') return '3'
  if (clean === '⭐⭐⭐⭐') return '4'
  if (clean === '⭐⭐⭐⭐⭐') return '5'
  return clean
}

function getRatingStars(num: string): string {
  if (num === '1') return '⭐'
  if (num === '2') return '⭐⭐'
  if (num === '3') return '⭐⭐⭐'
  if (num === '4') return '⭐⭐⭐⭐'
  if (num === '5') return '⭐⭐⭐⭐⭐'
  return num
}

function CustomMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select members'
}: {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(n => n !== name))
    } else {
      onChange([...selected, name])
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.multi-select-container')) {
        setIsOpen(false)
      }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [isOpen])

  const displayText = selected.length > 0 ? selected.join(', ') : placeholder

  return (
    <div className="relative w-full multi-select-container">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white w-full text-left flex items-center justify-between hover:border-white/20 transition-all focus:outline-none focus:border-[#e8c97d]"
      >
        <span className="truncate pr-4">{displayText}</span>
        <span className="text-gray-500 text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-[#121225] border border-white/10 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {selected.filter(name => !options.includes(name)).map(name => (
            <label
              key={name}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 text-xs text-white cursor-pointer hover:bg-white/10 transition-colors"
            >
              <input
                type="checkbox"
                checked={true}
                onChange={() => handleToggle(name)}
                className="rounded border-white/10 text-[#e8c97d] bg-[#0f0f1a] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
              />
              <span className="truncate">{name}</span>
            </label>
          ))}
          
          {options.map(name => {
            const isChecked = selected.includes(name)
            return (
              <label
                key={name}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white cursor-pointer transition-colors ${
                  isChecked ? 'bg-[#e8c97d]/10 text-[#e8c97d]' : 'hover:bg-white/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(name)}
                  className="rounded border-white/10 text-[#e8c97d] bg-[#0f0f1a] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                <span className="truncate">{name}</span>
              </label>
            )
          })}
          
          {options.length === 0 && selected.length === 0 && (
            <div className="text-center py-3 text-xs text-gray-500">No members loaded.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PICompletedClient({ userName, isAdmin = false }: Props) {
  const router = useRouter()
  const [sheetData, setSheetData] = useState<string[][]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [credentialsError, setCredentialsError] = useState(false)
  const [apiError, setApiError] = useState('')
  const [generalError, setGeneralError] = useState('')

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [editedRowData, setEditedRowData] = useState<string[]>([])
  const [savingRow, setSavingRow] = useState(false)

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle')
  const [syncError, setSyncError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  async function loadSpreadsheetData() {
    setLoadingData(true)
    setApiError('')
    setCredentialsError(false)
    setGeneralError('')
    try {
      const res = await authFetch(getApiUrl('/api/inductions'))
      const data = await res.json()
      if (!res.ok) {
        setGeneralError(data.error ?? 'Failed to load spreadsheet data.')
        return
      }

      setConfigured(data.configured)
      if (data.configured) {
        if (data.credentialsError) {
          setCredentialsError(true)
        } else if (data.apiError) {
          setApiError(data.apiError)
        } else if (data.values) {
          setSheetData(data.values)
        }
      }
    } catch {
      setGeneralError('Failed to load spreadsheet data.')
    } finally {
      setLoadingData(false)
    }
  }

  const [memberNames, setMemberNames] = useState<string[]>([])

  useEffect(() => {
    loadSpreadsheetData()
    async function loadMembers() {
      try {
        const res = await authFetch(getApiUrl('/api/users'))
        const data = await res.json()
        if (res.ok && Array.isArray(data.users)) {
          setMemberNames(data.users)
        }
      } catch (err) {
        console.error('Failed to load registered member names:', err)
      }
    }
    loadMembers()
  }, [])

  const headers = sheetData[0] || []
  const dataRows = sheetData.slice(1)

  const isPiDone = (row: string[]) => {
    const piStatusIdx = headers.findIndex(h => (h || '').toLowerCase().trim() === 'pi status')
    const piCompletionIdx = headers.findIndex(h => (h || '').toLowerCase().trim() === 'pi completion')
    const statusVal = piStatusIdx !== -1 ? (row[piStatusIdx] || '').toLowerCase().trim() : ''
    const completionVal = piCompletionIdx !== -1 ? (row[piCompletionIdx] || '').toLowerCase().trim() : ''
    return statusVal === 'pi done' || completionVal === 'pi done'
  }

  // Filter completed candidates matching search query
  const completedCandidates = dataRows
    .map((row, index) => ({ row, originalIndex: index }))
    .filter(item => isPiDone(item.row))
    .filter(item => {
      const name = item.row[0] || ''
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })

  // Track if active selection has unsaved changes
  const originalRowData = selectedRowIndex !== null ? dataRows[selectedRowIndex] : null
  const hasUnsavedChanges = selectedRowIndex !== null && originalRowData !== null && (
    JSON.stringify(editedRowData) !== JSON.stringify(originalRowData)
  )

  async function saveRow(rIdx: number, rowValues: string[]) {
    setSavingRow(true)
    setSyncStatus('syncing')
    setSyncError('')
    try {
      const res = await authFetch(getApiUrl('/api/inductions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: rIdx, rowValues }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSyncStatus('error')
        setSyncError(data.error ?? 'Failed to save changes.')
        setSavingRow(false)
        return false
      }
      setSyncStatus('saved')
      const copy = [...sheetData]
      copy[rIdx + 1] = rowValues
      setSheetData(copy)
      setTimeout(() => {
        setSyncStatus((current) => (current === 'saved' ? 'idle' : current))
      }, 3000)
      setSavingRow(false)
      return true
    } catch {
      setSyncStatus('error')
      setSyncError('Failed to save candidate details due to connection error.')
      setSavingRow(false)
      return false
    }
  }

  function handleBack() {
    if (hasUnsavedChanges) {
      if (typeof window !== 'undefined') {
        if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
          return
        }
      }
    }
    setSelectedRowIndex(null)
  }

  async function handleSave(goBack = false) {
    if (selectedRowIndex === null) return
    const success = await saveRow(selectedRowIndex, editedRowData)
    if (success && goBack) {
      setSelectedRowIndex(null)
    }
  }

  // Define headers ordering and sizes logic matching Inductions page
  const mainExcluded = [
    'name', 'email', 'mobile', 'gender', 'first_preference', 'second_preference', 'third_preference',
    'creativity', 'team knowledge', 'critical thinking', 'pi scheduled for', 'pi taken by',
    'task given', 'remarks', 'comments on task', 'whatsapp message', 'mark as'
  ]
  const orderedHeaders = [
    // Pre-fields
    ...headers.map((h, i) => ({ header: h, colIdx: i })).filter(item => {
      const name = (item.header || '').toLowerCase().trim()
      return [
        'email', 'mobile', 'gender', 'first_preference', 'second_preference', 'third_preference',
        'creativity', 'team knowledge', 'critical thinking', 'pi scheduled for', 'pi taken by',
        'whatsapp message'
      ].includes(name)
    }),
    // Task given & Remarks
    ...headers.map((h, i) => ({ header: h, colIdx: i })).filter(item => {
      const name = (item.header || '').toLowerCase().trim()
      return ['task given', 'remarks'].includes(name)
    }),
    // Comments on task
    ...headers.map((h, i) => ({ header: h, colIdx: i })).filter(item => {
      const name = (item.header || '').toLowerCase().trim()
      return name === 'comments on task'
    }),
    // Color option (Mark As)
    ...headers.map((h, i) => ({ header: h, colIdx: i })).filter(item => {
      const name = (item.header || '').toLowerCase().trim()
      return name === 'mark as'
    }),
    // Remaining columns
    ...headers.map((h, i) => ({ header: h, colIdx: i })).filter(item => {
      const name = (item.header || '').toLowerCase().trim()
      return name && !mainExcluded.includes(name)
    })
  ]

  return (
    <AppShell userName={userName} isAdmin={isAdmin}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Inductions candidates</p>
          <h1 className="text-2xl font-semibold text-white">PI Completed</h1>
          <p className="text-sm text-gray-400 mt-1">
            View and manage details of completed candidates.
          </p>
        </div>

        {/* Sync Status Badge */}
        {configured && sheetData.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            {syncStatus === 'syncing' && (
              <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Syncing changes...
              </span>
            )}
            {syncStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                ✓ Changes synced to Google Sheet
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                ✕ Error: {syncError || 'Sync failed'}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Error Displays */}
      {generalError && (
        <div className="bg-red-500/15 border border-red-500/20 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm text-red-400">{generalError}</p>
        </div>
      )}

      {loadingData ? (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 text-center text-sm text-gray-500">
          Loading induction sheet data…
        </div>
      ) : !configured ? (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-400 mb-2">No Google Sheet link has been configured yet.</p>
          <p className="text-xs text-gray-500">Please complete the setup on the Inductions page.</p>
        </div>
      ) : credentialsError ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Google Sheets integration credentials missing</h3>
          <p className="text-xs text-gray-400">
            The Google service account credentials have not been configured. Please contact an administrator.
          </p>
        </div>
      ) : apiError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Google Sheets API Error</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">{apiError}</p>
        </div>
      ) : sheetData.length === 0 ? (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-400">The spreadsheet is empty.</p>
        </div>
      ) : selectedRowIndex === null ? (
        /* Candidates List View */
        <div className="space-y-6 animate-fade-in">
          {/* Search bar & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
            <div className="relative flex-1 min-w-[280px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search completed candidate by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#e8c97d] transition-colors"
              />
            </div>
            <div className="text-xs text-gray-400 flex gap-4">
              <div>
                <span className="text-gray-500">Completed Candidates:</span> <strong className="text-white">{completedCandidates.length}</strong>
              </div>
            </div>
          </div>

          {/* Candidate Name Cards Grid */}
          {completedCandidates.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-sm text-gray-400">No completed candidates match your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completedCandidates.map(({ row, originalIndex }) => {
                const candidateName = row[0] || 'Unnamed Candidate'
                const firstChar = candidateName.trim().charAt(0).toUpperCase() || '?'
                
                // Color support
                const colorColIndex = headers.findIndex(h => /mark\s*as|color/i.test(h))
                const candidateColor = colorColIndex !== -1 ? (row[colorColIndex] || '').toLowerCase().trim() : ''

                const cardColorClass = (colorVal: string) => {
                  if (colorVal === 'green') return 'border-emerald-500/40 bg-emerald-500/[0.02] hover:border-emerald-500/60 hover:bg-[#1a1a2e]'
                  if (colorVal === 'yellow') return 'border-amber-500/40 bg-amber-500/[0.02] hover:border-amber-500/60 hover:bg-[#1a1a2e]'
                  if (colorVal === 'red') return 'border-red-500/40 bg-red-500/[0.02] hover:border-red-500/60 hover:bg-[#1a1a2e]'
                  return 'border-white/10 hover:border-[#e8c97d]/50 hover:bg-[#1f1f35]'
                }

                return (
                  <div
                    key={originalIndex}
                    onClick={() => {
                      setSelectedRowIndex(originalIndex)
                      setEditedRowData([...row])
                    }}
                    className={`border rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex items-center justify-between ${cardColorClass(candidateColor)}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#e8c97d]/10 text-[#e8c97d] flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                        {firstChar}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-white group-hover:text-[#e8c97d] transition-colors truncate">
                          {candidateName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-gray-500 font-mono">Row #{originalIndex + 2}</p>
                          {candidateColor && (
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              candidateColor === 'green' ? 'bg-emerald-500' :
                              candidateColor === 'yellow' ? 'bg-amber-500' :
                              candidateColor === 'red' ? 'bg-red-500' : ''
                            }`} />
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 group-hover:text-[#e8c97d] group-hover:translate-x-1 transition-all text-sm flex-shrink-0 pl-2">
                      ➔
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Refresh Action Row */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <button
              onClick={loadSpreadsheetData}
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium px-4 py-2.5 rounded-xl text-xs transition-all"
            >
              Refresh Data
            </button>
          </div>
        </div>
      ) : (
        /* Candidate Details Edit View */
        <div className="space-y-6 animate-fade-in">
          {/* Header Action row */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition-all"
            >
              ← Back to List
            </button>
            <div className="flex gap-3">
              {hasUnsavedChanges && (
                <button
                  onClick={() => setEditedRowData([...originalRowData!])}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition-all"
                >
                  Discard Changes
                </button>
              )}
              <button
                onClick={() => handleSave(false)}
                disabled={savingRow || !hasUnsavedChanges}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-30 disabled:hover:bg-white/5"
              >
                Save
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={savingRow}
                className="bg-[#e8c97d] hover:bg-[#f0d898] text-[#0f0f1a] font-semibold px-4 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {savingRow ? 'Saving...' : 'Save & Close'}
              </button>
            </div>
          </div>

          {/* Profile Name Header */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#e8c97d]/10 text-[#e8c97d] flex items-center justify-center font-bold text-xl">
              {(editedRowData[0] || 'Unnamed').trim().charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{editedRowData[0] || 'Unnamed Candidate'}</h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Edit mode · Spreadsheet row index: {selectedRowIndex + 2}</p>
            </div>
          </div>

          {/* Dynamic Fields Grid */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-3">Candidate Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderedHeaders.map(({ header, colIdx }) => {
                const headerName = (header || '').toLowerCase().trim()
                
                // 1. Response Dropdown
                if (headerName === 'response') {
                  const val = editedRowData[colIdx] || ''
                  const options = ['Acknowledged', 'Not yet', 'Opted out']
                  const normalizedVal = options.find(o => o.toLowerCase() === val.toLowerCase()) || val
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <select
                        value={normalizedVal}
                        onChange={e => {
                          const copy = [...editedRowData]
                          copy[colIdx] = e.target.value
                          setEditedRowData(copy)
                        }}
                        className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e8c97d] transition-colors w-full appearance-none"
                      >
                        <option value="" disabled className="text-gray-600">Select response</option>
                        {options.map(opt => (
                          <option key={opt} value={opt} className="bg-[#0f0f1a] text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }

                // 2. Task Review Dropdown
                if (headerName === 'task review') {
                  const val = editedRowData[colIdx] || ''
                  const ratingNum = getRatingNumber(val)
                  const options = ['1', '2', '3', '4', '5']
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <select
                        value={ratingNum}
                        onChange={e => {
                          const copy = [...editedRowData]
                          copy[colIdx] = getRatingStars(e.target.value)
                          setEditedRowData(copy)
                        }}
                        className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e8c97d] transition-colors w-full"
                      >
                        <option value="" className="text-gray-600">Select rating</option>
                        {val && !options.includes(ratingNum) && (
                          <option value={ratingNum}>{val}</option>
                        )}
                        {options.map(opt => (
                          <option key={opt} value={opt} className="bg-[#0f0f1a] text-white">
                            {opt} {getRatingStars(opt)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }

                // 3. Creativity, Team Knowledge, Critical Thinking Dropdowns (1-5)
                if (headerName === 'creativity' || headerName === 'team knowledge' || headerName === 'critical thinking') {
                  const val = editedRowData[colIdx] || ''
                  const options = ['1', '2', '3', '4', '5']
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <select
                        value={val}
                        onChange={e => {
                          const copy = [...editedRowData]
                          copy[colIdx] = e.target.value
                          setEditedRowData(copy)
                        }}
                        className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e8c97d] transition-colors w-full"
                      >
                        <option value="" className="text-gray-600">Select rating</option>
                        {val && !options.includes(val) && (
                          <option value={val}>{val}</option>
                        )}
                        {options.map(opt => (
                          <option key={opt} value={opt} className="bg-[#0f0f1a] text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }

                // 4. Task Given & Remarks resizable textareas
                if (headerName === 'task given' || headerName === 'remarks') {
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <textarea
                        value={editedRowData[colIdx] || ''}
                        onChange={e => {
                          const copy = [...editedRowData]
                          copy[colIdx] = e.target.value
                          setEditedRowData(copy)
                        }}
                        rows={4}
                        className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors w-full resize-y min-h-[100px]"
                        placeholder={`Enter ${header}`}
                      />
                    </div>
                  )
                }

                // 5. PI Scheduled For & PI Taken By multiselect dropdowns
                if (headerName === 'pi scheduled for' || headerName === 'pi taken by') {
                  const val = editedRowData[colIdx] || ''
                  const selectedNames = val ? val.split(',').map(s => s.trim()).filter(Boolean) : []
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5 relative">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <CustomMultiSelect
                        options={memberNames}
                        selected={selectedNames}
                        onChange={(newSelected) => {
                          const copy = [...editedRowData]
                          copy[colIdx] = newSelected.join(', ')
                          setEditedRowData(copy)
                        }}
                        placeholder="Select member name"
                      />
                    </div>
                  )
                }

                // 6. Comments on Task Textarea
                if (headerName === 'comments on task') {
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <textarea
                        value={editedRowData[colIdx] || ''}
                        onChange={e => {
                          const copy = [...editedRowData]
                          copy[colIdx] = e.target.value
                          setEditedRowData(copy)
                        }}
                        rows={4}
                        className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors w-full resize-y min-h-[100px]"
                        placeholder={`Enter ${header}`}
                      />
                    </div>
                  )
                }

                // 7. WhatsApp Message field with Pi Done button
                if (headerName === 'whatsapp message') {
                  const mobileColIdx = headers.findIndex(h => /mobile|phone/i.test(h))
                  const candidateMobile = mobileColIdx !== -1 ? (editedRowData[mobileColIdx] || '') : ''
                  
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!candidateMobile) {
                              alert('No mobile number available for this candidate.')
                              return
                            }
                            router.push(`/dashboard/?phone=${encodeURIComponent(candidateMobile)}&pi=1&row=${selectedRowIndex}`)
                          }}
                          className="bg-[#0f0f1a] border border-white/10 hover:border-[#e8c97d] text-white rounded-xl px-4 py-3.5 text-sm transition-all flex-1 text-left"
                        >
                          messaged on whatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...editedRowData]
                            const piStatusIdx = headers.findIndex(h => (h || '').toLowerCase().trim() === 'pi status')
                            const piCompletionIdx = headers.findIndex(h => (h || '').toLowerCase().trim() === 'pi completion')
                            
                            if (piStatusIdx !== -1) copy[piStatusIdx] = 'PI done'
                            if (piCompletionIdx !== -1) copy[piCompletionIdx] = 'PI done'
                            
                            setEditedRowData(copy)
                          }}
                          className="bg-[#e8c97d]/10 border border-[#e8c97d]/20 hover:bg-[#e8c97d]/20 text-[#e8c97d] rounded-xl px-4 py-3.5 text-sm font-semibold transition-all"
                        >
                          pi done
                        </button>
                      </div>
                    </div>
                  )
                }

                // 8. Mark As Color buttons (READ ONLY / DISABLED HERE)
                if (headerName === 'mark as') {
                  const val = (editedRowData[colIdx] || '').toLowerCase().trim()
                  const colorOptions = [
                    { label: 'None', value: '', colorClass: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
                    { label: 'Green', value: 'green', colorClass: 'bg-[#10b9811a] text-[#10b981] border-[#10b98133]' },
                    { label: 'Yellow', value: 'yellow', colorClass: 'bg-[#f59e0b1a] text-[#f59e0b] border-[#f59e0b33]' },
                    { label: 'Red', value: 'red', colorClass: 'bg-[#ef44441a] text-[#ef4444] border-[#ef444433]' },
                  ]
                  return (
                    <div key={colIdx} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {header}
                      </label>
                      <div className="flex gap-2">
                        {colorOptions.map(opt => {
                          const isSelected = val === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={true}
                              className={`px-3 py-2 rounded-xl border text-xs font-semibold opacity-50 cursor-not-allowed transition-all ${
                                isSelected
                                  ? opt.value === 'green' ? 'bg-[#10b981] text-[#0f0f1a] border-[#10b981] opacity-100'
                                    : opt.value === 'yellow' ? 'bg-[#f59e0b] text-[#0f0f1a] border-[#f59e0b] opacity-100'
                                    : opt.value === 'red' ? 'bg-[#ef4444] text-white border-[#ef4444] opacity-100'
                                    : 'bg-white text-[#0f0f1a] border-white opacity-100'
                                  : 'bg-transparent text-gray-600 border-white/5'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // 9. Default Text Input
                return (
                  <div key={colIdx} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {header || `Column ${colIdx + 1}`}
                    </label>
                    <input
                      type="text"
                      value={editedRowData[colIdx] || ''}
                      onChange={e => {
                        const copy = [...editedRowData]
                        copy[colIdx] = e.target.value
                        setEditedRowData(copy)
                      }}
                      className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors w-full"
                      placeholder={`Enter ${header || `Column ${colIdx + 1}`}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
