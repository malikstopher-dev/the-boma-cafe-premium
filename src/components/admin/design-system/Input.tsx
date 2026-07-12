'use client'

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'
import styles from './DesignSystem.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, required, error, helperText, className = '', ...props }, ref) => {
    const inputClasses = [
      styles.input,
      error ? styles.inputError : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div className={styles.inputWrapper}>
        {label && (
          <label className={`${styles.inputLabel} ${required ? styles.inputLabelRequired : ''}`}>
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <span className={styles.inputErrorText}>{error}</span>}
        {helperText && !error && <span className={styles.inputHelper}>{helperText}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, required, error, helperText, className = '', ...props }, ref) => {
    const inputClasses = [
      styles.input,
      styles.textarea,
      error ? styles.inputError : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div className={styles.inputWrapper}>
        {label && (
          <label className={`${styles.inputLabel} ${required ? styles.inputLabelRequired : ''}`}>
            {label}
          </label>
        )}
        <textarea ref={ref} className={inputClasses} {...props} />
        {error && <span className={styles.inputErrorText}>{error}</span>}
        {helperText && !error && <span className={styles.inputHelper}>{helperText}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
  className?: string
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
}

export function Select({ label, required, error, helperText, options, className = '', ...props }: SelectProps) {
  const selectClasses = [
    styles.input,
    styles.select,
    error ? styles.inputError : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.inputWrapper}>
      {label && (
        <label className={`${styles.inputLabel} ${required ? styles.inputLabelRequired : ''}`}>
          {label}
        </label>
      )}
      <select className={selectClasses} {...props}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className={styles.inputErrorText}>{error}</span>}
      {helperText && !error && <span className={styles.inputHelper}>{helperText}</span>}
    </div>
  )
}
