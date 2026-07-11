'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from './AppShell'
import { authFetch, getApiUrl } from '@/lib/utils'

interface Props {
  userName: string
  isAdmin?: boolean
  currentUserId: number
}

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

const getRatingNumber = (val: string): string => {
  if (!val) return ''
  const trimmed = val.trim()
  if (/^[1-5]$/.test(trimmed)) return trimmed
  const starCount = (trimmed.match(/★/g) || []).length
  if (starCount >= 1 && starCount <= 5) return String(starCount)
  return ''
}

const getRatingStars = (num: string): string => {
  const n = parseInt(num)
  if (isNaN(n) || n < 1 || n > 5) return num
  return '★'.repeat(n) + '☆'.repeat(5 - n)
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

export default function InductionsClient({ userName, isAdmin = false, currentUserId }: Props) {
  const router = useRouter()
  const [sheetLink, setSheetLink] = useState('')
  const [savingLink, setSavingLink] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // sheetData contains all rows: headers are sheetData[0], data rows are sheetData.slice(1)
  const [sheetData, setSheetData] = useState<string[][]>([])
  const [configured, setConfigured] = useState(false)
  const [credentialsError, setCredentialsError] = useState(false)
  const [apiError, setApiError] = useState('')
  const [generalError, setGeneralError] = useState('')

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState('')

  // Track the original value of the focused cell to prevent redundant API calls
  const [focusedValue, setFocusedValue] = useState('')

  async function loadLink() {
    if (!isAdmin) return
    try {
      const res = await authFetch(getApiUrl('/api/admin/inductions-link'))
      const data = await res.json()
      if (res.ok && data.link) {
        setSheetLink(data.link)
      }
    } catch (err) {
      console.error('Failed to load sheet link:', err)
    }
  }

  async function saveLink() {
    setSavingLink(true)
    setGeneralError('')
    try {
      const res = await authFetch(getApiUrl('/api/admin/inductions-link'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: sheetLink }),
      })
      if (!res.ok) {
        const data = await res.json()
        setGeneralError(data.error ?? 'Failed to save link.')
        return
      }
      // Reload spreadsheet data once link is saved
      loadSpreadsheetData()
    } catch {
      setGeneralError('Failed to save link.')
    } finally {
      setSavingLink(false)
    }
  }

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
          if (!sheetLink && data.link) {
            setSheetLink(data.link)
          }
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
    loadLink()
    loadSpreadsheetData()
    async function loadMembers() {
      try {
        const res = await authFetch(getApiUrl('/api/users'))
        if (res.ok) {
          const data = await res.json()
          setMemberNames(data.names || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadMembers()
  }, [])

  const headers = sheetData[0] || []
  const dataRows = sheetData.slice(1)

  const rawHeaders = headers.map((header, colIdx) => ({ header, colIdx }))
  
  const whatsappItem = rawHeaders.find(item => (item.header || '').toLowerCase().trim() === 'whatsapp message')
  const taskGivenItem = rawHeaders.find(item => (item.header || '').toLowerCase().trim() === 'task given')
  const remarksItem = rawHeaders.find(item => (item.header || '').toLowerCase().trim() === 'remarks')

  const filtered = rawHeaders.filter(item => {
    const h = (item.header || '').toLowerCase().trim()
    return h !== 'whatsapp message' && h !== 'task given' && h !== 'remarks'
  })

  const targetIdx = filtered.findIndex(item => (item.header || '').toLowerCase().trim() === 'comments on task')

  if (targetIdx !== -1) {
    const insertItems = []
    if (whatsappItem) insertItems.push(whatsappItem)
    if (taskGivenItem) insertItems.push(taskGivenItem)
    if (remarksItem) insertItems.push(remarksItem)
    filtered.splice(targetIdx, 0, ...insertItems)
  } else {
    if (whatsappItem) filtered.push(whatsappItem)
    if (taskGivenItem) filtered.push(taskGivenItem)
    if (remarksItem) filtered.push(remarksItem)
  }

  const orderedHeaders = filtered

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [editedRowData, setEditedRowData] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [savingRow, setSavingRow] = useState(false)

  // Check for unsaved changes on the detail page
  const originalRow = selectedRowIndex !== null ? (dataRows[selectedRowIndex] || []) : []
  const hasUnsavedChanges = selectedRowIndex !== null && editedRowData.some((val, idx) => val !== (originalRow[idx] || ''))

  async function saveRow(rIdx: number, rowValues: string[]) {
    setSavingRow(true)
    setSyncStatus('syncing')
    setSyncError('')
    try {
      const res = await authFetch(getApiUrl('/api/inductions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: rIdx,
          rowValues,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSyncStatus('error')
        setSyncError(data.error ?? 'Failed to save candidate details.')
        setSavingRow(false)
        return false
      }
      setSyncStatus('saved')
      // Update local state
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

  function addRow() {
    if (headers.length === 0) return
    const newEmptyRow = new Array(headers.length).fill('')
    const newRowIndex = dataRows.length
    setSheetData(prev => [...prev, newEmptyRow])
    setSelectedRowIndex(newRowIndex)
    setEditedRowData(newEmptyRow)
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

  const filteredDataRows = dataRows
    .map((row, index) => ({ row, originalIndex: index }))
    .filter(item => {
      const name = item.row[0] || ''
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const piStatusIdx = headers.findIndex(h => (h || '').toLowerCase().trim() === 'pi status')
      const piCompletionIdx = headers.findIndex(h => (h || '').toLowerCase().trim() === 'pi completion')
      const statusVal = piStatusIdx !== -1 ? (item.row[piStatusIdx] || '').toLowerCase().trim() : ''
      const completionVal = piCompletionIdx !== -1 ? (item.row[piCompletionIdx] || '').toLowerCase().trim() : ''
      const isPiDone = statusVal === 'pi done' || completionVal === 'pi done'

      return matchesSearch && !isPiDone
    })

  return (
    <AppShell userName={userName} isAdmin={isAdmin}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Inductions candidates</p>
          <h1 className="text-2xl font-semibold">Inductions Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time spreadsheet of candidate inductions progress.
          </p>
        </div>

        {/* Sync Status Badge */}
        {configured && !credentialsError && !apiError && sheetData.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            {syncStatus === 'syncing' && (
              <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Syncing changes...
              </span>
            )}
            {syncStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-fade-in">
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

      {/* Admin Setting Section */}
      {isAdmin && (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold mb-2">Google Sheet Configuration</h2>
          <p className="text-xs text-gray-400 mb-4">
            Link a Google Sheet to fetch candidate data. Make sure to share the sheet with your Service Account email as <strong>Editor</strong>.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={sheetLink}
              onChange={e => setSheetLink(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              className="flex-1 bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors"
            />
            <button
              onClick={saveLink}
              disabled={savingLink}
              className="bg-[#e8c97d] hover:bg-[#f0d898] text-[#0f0f1a] font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {savingLink ? 'Saving...' : 'Save link'}
            </button>
          </div>
          {generalError && <p className="text-red-400 text-xs mt-2">{generalError}</p>}
        </div>
      )}

      {/* Error or Warning Displays */}
      {generalError && !isAdmin && (
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
          {isAdmin ? (
            <p className="text-xs text-gray-500">Please provide a Google Sheet link in the box above to get started.</p>
          ) : (
            <p className="text-xs text-gray-500">Please contact an administrator to complete the configuration.</p>
          )}
        </div>
      ) : credentialsError ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Google Sheets integration credentials missing</h3>
          {isAdmin ? (
            <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
              <p>The server needs Google service account credentials to authenticate and communicate with your sheet.</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Create a Service Account on Google Cloud and generate a JSON credential key file.</li>
                <li>Add the following environment variables to your <code>.env.local</code> file:
                  <ul className="list-disc pl-4 mt-1 font-mono text-[10px] text-amber-300">
                    <li>GOOGLE_SERVICE_ACCOUNT_EMAIL</li>
                    <li>GOOGLE_PRIVATE_KEY</li>
                  </ul>
                </li>
                <li>Share your Google Sheet with the Service Account email as an <strong>Editor</strong>.</li>
                <li>Restart your development server or redeploy the application.</li>
              </ol>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              The Google service account credentials have not been configured by the system administrator. Please contact them to enable this section.
            </p>
          )}
        </div>
      ) : apiError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Google Sheets API Error</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">{apiError}</p>
          <div className="text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-400">Troubleshooting checklist:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Confirm that the spreadsheet has been shared with your Service Account email as an <strong>Editor</strong>.</li>
              <li>Verify that the Google Sheet URL you pasted is correct and contains a valid sheet ID.</li>
              <li>Make sure that your Google Cloud Project has the <strong>Google Sheets API</strong> enabled.</li>
            </ul>
            <button
              onClick={loadSpreadsheetData}
              className="mt-4 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-lg text-xs transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : sheetData.length === 0 ? (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-400">The spreadsheet is empty. Add columns and rows in Google Sheets, then refresh.</p>
          <button
            onClick={loadSpreadsheetData}
            className="mt-4 px-3 py-1.5 bg-[#e8c97d] text-[#0f0f1a] rounded-lg text-xs font-semibold"
          >
            Refresh
          </button>
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
                placeholder="Search candidate by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#e8c97d] transition-colors"
              />
            </div>
            <div className="text-xs text-gray-400 flex gap-4">
              <div>
                <span className="text-gray-500">Total:</span> <strong className="text-white">{dataRows.length}</strong>
              </div>
              {searchQuery && (
                <div>
                  <span className="text-gray-500">Filtered:</span> <strong className="text-white">{filteredDataRows.length}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Name Cards */}
          {filteredDataRows.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-sm text-gray-400">No active candidates match your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDataRows.map(({ row, originalIndex }) => {
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

          {/* Bottom Actions Row */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={addRow}
                className="bg-[#e8c97d] hover:bg-[#f0d898] text-[#0f0f1a] font-semibold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <span className="text-sm font-semibold">+</span> Add Candidate
              </button>
              <button
                onClick={loadSpreadsheetData}
                className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium px-4 py-2.5 rounded-xl text-xs transition-all"
              >
                Refresh Data
              </button>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="bg-[#1a1a2e]/50 border border-white/5 rounded-2xl p-4 text-xs text-gray-500">
            <p className="font-semibold text-gray-400 mb-1">💡 Instructions:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Click on any candidate card to open their profile details.</li>
              <li>Use "+ Add Candidate" to create a new applicant entry and immediately configure their details page.</li>
              <li>Refresh data if any updates are directly made in the linked Google Sheet.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Candidates Details Form Page View */
        <div className="space-y-6 animate-fade-in">
          {/* Header Area with Navigation & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleBack}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              ← Back to Candidates
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={savingRow}
                className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium px-4 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {savingRow ? 'Saving...' : 'Save Changes'}
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

                // 2. Task Review Dropdown (maps 1-5 rating to star string and back)
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
                        <option value="" className="text-gray-600">Select rating (1-5)</option>
                        {options.map(opt => (
                          <option key={opt} value={opt} className="bg-[#0f0f1a] text-white">
                            {opt} Stars
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }

                // 2.5. Creativity, Team Knowledge, Critical Thinking Dropdowns (1-5 rating)
                if (
                  headerName === 'creativity' ||
                  headerName === 'team knowledge' ||
                  headerName === 'critical thinking'
                ) {
                  const val = (editedRowData[colIdx] || '').trim()
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
                        {!options.includes(val) && (
                          <option value={val}>{val || 'Select rating (1-5)'}</option>
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

                // 2.7. Task Given & Remarks resizable textareas
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

                // 2.9. PI Scheduled For & PI Taken By multiselect dropdowns
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

                // 3. Comments on Task Textarea
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

                // 4. WhatsApp Message field -> click to redirect to PI Scheduler
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

                // 5. Mark As Color buttons
                if (headerName === 'mark as') {
                  const val = (editedRowData[colIdx] || '').toLowerCase().trim()
                  const colorOptions = [
                    { label: 'None', value: '', colorClass: 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20' },
                    { label: 'Green', value: 'green', colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25' },
                    { label: 'Yellow', value: 'yellow', colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25' },
                    { label: 'Red', value: 'red', colorClass: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25' },
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
                              onClick={() => {
                                const copy = [...editedRowData]
                                copy[colIdx] = opt.value
                                setEditedRowData(copy)
                              }}
                              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                                isSelected
                                  ? opt.value === 'green' ? 'bg-emerald-500 text-[#0f0f1a] border-emerald-500'
                                    : opt.value === 'yellow' ? 'bg-amber-500 text-[#0f0f1a] border-amber-500'
                                    : opt.value === 'red' ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-[#0f0f1a] border-white'
                                  : opt.colorClass
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

                // 5. Default Text Input
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

          {/* Warning state */}
          {hasUnsavedChanges && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-400 flex items-center gap-2">
              <span className="text-sm">⚠</span> You have unsaved changes. Remember to save before exiting or going back.
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}
