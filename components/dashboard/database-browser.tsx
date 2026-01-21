'use client'

import { Table } from "@/components/ui/table"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ChevronDown,
  ChevronRight,
  Database,
  Loader2,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TableInterface {
  table_name: string
  column_count: number
}

interface Column {
  column_name: string
  data_type: string
  is_nullable: string
}

interface DatabaseBrowserProps {
  projectUuid?: string | null
  resourceUuid?: string | null
}

export function DatabaseBrowser({ projectUuid, resourceUuid }: DatabaseBrowserProps = {}) {
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddRow, setShowAddRow] = useState(false)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [newRowData, setNewRowData] = useState<Record<string, any>>({})
  const [resourceDetails, setResourceDetails] = useState<any>(null)

  // Завантажити деталі ресурсу якщо це проектна БД
  useEffect(() => {
    if (projectUuid && resourceUuid) {
      const loadResourceDetails = async () => {
        try {
          const response = await fetch(
            `/api/projects/${projectUuid}/resources/${resourceUuid}`
          )
          if (response.ok) {
            const data = await response.json()
            setResourceDetails(data)
            console.log('[v0] Resource details loaded:', data)
          }
        } catch (err) {
          console.error('[v0] Error loading resource details:', err)
        }
      }
      loadResourceDetails()
    }
  }, [projectUuid, resourceUuid])

  // Завантажити список таблиць
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/database/tables')
        const data = await res.json()
        if (data.success) {
          setTables(data.tables)
        } else {
          setError('Помилка завантаження таблиць')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Невідома помилка')
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [])

  // Завантажити схему таблиці
  const loadTableSchema = async (tableName: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/database/${tableName}/schema`)
      const data = await res.json()
      if (data.success) {
        setColumns(data.columns)
        setSelectedTable(tableName)
        setPage(1)
        loadTableData(tableName, 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка')
    } finally {
      setLoading(false)
    }
  }

  // Завантажити дані таблиці
  const loadTableData = async (tableName: string, pageNum: number) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/database/${tableName}/data?page=${pageNum}&limit=50`)
      const data = await res.json()
      if (data.success) {
        setTableData(data.data)
        setTotalPages(data.pagination.pages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка')
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelect = (tableName: string) => {
    loadTableSchema(tableName)
    setExpanded(true)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      if (selectedTable) {
        loadTableData(selectedTable, newPage)
      }
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('Ви впевнені що хочете видалити цей рядок?')) return
    try {
      const res = await fetch(`/api/database/${selectedTable}/data/${rowId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        if (selectedTable) {
          loadTableData(selectedTable, page)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка видалення')
    }
  }

  const handleEditRow = (row: any) => {
    setEditingRow(row.id)
    setEditData(row)
  }

  const handleSaveRow = async () => {
    try {
      const res = await fetch(`/api/database/${selectedTable}/data/${editingRow}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      const data = await res.json()
      if (data.success) {
        setEditingRow(null)
        if (selectedTable) {
          loadTableData(selectedTable, page)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    }
  }

  const handleAddNewRow = async () => {
    try {
      const res = await fetch(`/api/database/${selectedTable}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowData),
      })
      const data = await res.json()
      if (data.success) {
        setShowAddRow(false)
        setNewRowData({})
        if (selectedTable) {
          loadTableData(selectedTable, page)
        }
      } else {
        setError(data.details || 'Помилка додавання рядка')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка додавання')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>
              {projectUuid && resourceDetails ? (
                <>
                  {resourceDetails.name || 'База Даних'}
                  {resourceDetails.database_name && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({resourceDetails.database_name})
                    </span>
                  )}
                </>
              ) : (
                'База Даних'
              )}
            </CardTitle>
            {tables.length > 0 && (
              <Badge variant="secondary">{tables.length} таблиць</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading && tables.length === 0 ? (
            <div className="flex items-center gap-2 justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Завантаження...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {tables.map((table) => (
                <Button
                  key={table.table_name}
                  variant={selectedTable === table.table_name ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => handleTableSelect(table.table_name)}
                >
                  {selectedTable === table.table_name ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <span className="truncate flex-1 text-left">{table.table_name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {table.column_count}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTable && expanded && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(false)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">{selectedTable}</CardTitle>
                <Badge>{tableData.length} рядків</Badge>
              </div>
              <Button size="sm" onClick={() => setShowAddRow(!showAddRow)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Схема таблиці */}
            <div className="bg-muted p-3 rounded-md space-y-2">
              <h4 className="font-medium text-sm">Структура таблиці:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {columns.map((col) => (
                  <div key={col.column_name} className="text-xs">
                    <span className="font-mono font-medium">{col.column_name}</span>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {col.data_type}
                      {col.is_nullable === 'YES' ? ' (nullable)' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Таблиця з даними */}
            {loading ? (
              <div className="flex items-center gap-2 justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Завантаження даних...</span>
              </div>
            ) : tableData.length > 0 ? (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <div className="Table">
                    <TableBody>
                      {tableData.map((row, idx) => (
                        <TableRow key={idx} className={editingRow === row.id ? 'bg-muted' : ''}>
                          {columns.map((col) => (
                            <TableCell key={`${idx}-${col.column_name}`} className="font-mono text-xs">
                              {editingRow === row.id ? (
                                <Input
                                  size="sm"
                                  type="text"
                                  value={editData[col.column_name] ?? ''}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      [col.column_name]: e.target.value,
                                    })
                                  }
                                  className="h-6 text-xs"
                                />
                              ) : (
                                formatCellValue(row[col.column_name])
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center space-x-1">
                            {editingRow === row.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:text-green-600"
                                  onClick={handleSaveRow}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:text-red-600"
                                  onClick={() => setEditingRow(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:text-blue-600"
                                  onClick={() => handleEditRow(row)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:text-red-600"
                                  onClick={() => handleDeleteRow(row.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {showAddRow && (
                        <TableRow className="bg-blue-50">
                          {columns.map((col) => (
                            <TableCell key={`new-${col.column_name}`} className="font-mono text-xs p-1">
                              <Input
                                type="text"
                                placeholder={`${col.column_name} (${col.data_type})`}
                                value={newRowData[col.column_name] ?? ''}
                                onChange={(e) =>
                                  setNewRowData({
                                    ...newRowData,
                                    [col.column_name]: e.target.value,
                                  })
                                }
                                className="h-6 text-xs"
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center space-x-1 p-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:text-green-600"
                              onClick={handleAddNewRow}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:text-red-600"
                              onClick={() => {
                                setShowAddRow(false)
                                setNewRowData({})
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </div>
                </div>

                {/* Пагінація */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Сторінка {page} з {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Таблиця порожня</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatCellValue(value: any): string {
  if (value === null) return 'NULL'
  if (value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '...'
  return String(value)
}
