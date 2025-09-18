// Editable Number Component
// Click to edit numeric values inline

'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit3, Check, X } from 'lucide-react'

interface EditableNumberProps {
  value: number
  onSave: (newValue: number) => Promise<void>
  min?: number
  max?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  suffix?: string
}

export default function EditableNumber({
  value,
  onSave,
  min = 0,
  max = 365,
  placeholder = "Enter value",
  className = "",
  disabled = false,
  suffix = ""
}: EditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    if (disabled) return
    setEditValue(value.toString())
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditValue(value.toString())
    setIsEditing(false)
  }

  const handleSave = async () => {
    const numValue = parseInt(editValue)

    if (isNaN(numValue) || numValue < min || numValue > max) {
      // Invalid value, reset
      setEditValue(value.toString())
      return
    }

    if (numValue === value) {
      // No change
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(numValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving value:', error)
      // Reset on error
      setEditValue(value.toString())
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={isSaving}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1c5975] focus:border-transparent"
        />
        <div className="flex items-center space-x-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
            title="Save"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center space-x-1 group ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
      onClick={handleEdit}
    >
      <span className="font-medium text-gray-900 font-asap">
        {value}{suffix && ` ${suffix}`}
      </span>
      {!disabled && (
        <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  )
}