'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { Calculator, Download, RefreshCw, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

interface FinancialModelBlockProps {
  blockId: string
  title?: string
  modelType: 'dcf' | 'lbo' | 'scenario' | 'custom'
  template?: any
  requiredFields?: string[]
  calculations?: {
    [key: string]: string // Formula expressions
  }
}

interface ModelData {
  [key: string]: number | string
}

export default function FinancialModelBlock({
  blockId,
  title = 'Financial Model',
  modelType,
  template,
  requiredFields = [],
  calculations = {}
}: FinancialModelBlockProps) {
  const { getBlockState, updateBlockState, currentStageId } = useCaseStudyStore()
  const [modelData, setModelData] = useState<ModelData>({})
  const [calculatedValues, setCalculatedValues] = useState<ModelData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Define functions before useEffects that use them
  const evaluateFormula = (formula: string, data: ModelData): number => {
    // Simple formula evaluation - replace variable names with values
    let expression = formula
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number') {
        expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString())
      }
    })

    // Basic math evaluation (in production, use a proper math parser)
    try {
      // Remove any non-math characters for safety
      expression = expression.replace(/[^0-9+\-*/.() ]/g, '')
      return Function(`"use strict"; return (${expression})`)()
    } catch {
      throw new Error('Invalid formula')
    }
  }

  const validateModel = (currentModelData: ModelData, currentErrors: Record<string, string>): boolean => {
    // Check required fields
    for (const field of requiredFields) {
      if (!(field in currentModelData) || currentModelData[field] === '' || currentModelData[field] === null) {
        return false
      }
    }

    // Check for calculation errors
    if (Object.keys(currentErrors).length > 0) {
      return false
    }

    return true
  }

  // Load existing model data
  useEffect(() => {
    if (currentStageId) {
      const blockState = getBlockState(currentStageId, blockId)
      if (blockState?.modelData) {
        setModelData(blockState.modelData)
      } else if (template) {
        setModelData(template)
      }
    }
  }, [currentStageId, blockId, getBlockState, template])

  // Calculate derived values
  useEffect(() => {
    const calculated: ModelData = {}
    const newErrors: Record<string, string> = {}

    Object.entries(calculations).forEach(([key, formula]) => {
      try {
        // Simple formula evaluation (in production, use a proper expression parser)
        const result = evaluateFormula(formula, modelData)
        calculated[key] = result
      } catch (error) {
        newErrors[key] = `Error in ${key}: ${error}`
      }
    })

    setCalculatedValues(calculated)
    setErrors(newErrors)
  }, [modelData, calculations])

  // Save model data to store
  useEffect(() => {
    if (currentStageId && Object.keys(modelData).length > 0) {
      updateBlockState(currentStageId, blockId, {
        modelData,
        calculatedValues,
        isValid: validateModel(modelData, errors),
        lastUpdated: new Date().toISOString()
      })
    }
  }, [modelData, calculatedValues, errors, currentStageId, blockId, updateBlockState])

  const handleInputChange = (key: string, value: string | number) => {
    setModelData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleReset = () => {
    setModelData(template || {})
  }

  const handleExport = () => {
    const exportData = {
      inputs: modelData,
      calculations: calculatedValues,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-model-${blockId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderModelInputs = () => {
    switch (modelType) {
      case 'dcf':
        return renderDCFInputs()
      case 'lbo':
        return renderLBOInputs()
      case 'scenario':
        return renderScenarioInputs()
      default:
        return renderCustomInputs()
    }
  }

  const renderDCFInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="revenue">Revenue (Year 1, $M)</Label>
        <Input
          id="revenue"
          type="number"
          value={modelData.revenue || ''}
          onChange={(e) => handleInputChange('revenue', parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="growthRate">Revenue Growth Rate (%)</Label>
        <Input
          id="growthRate"
          type="number"
          value={modelData.growthRate || ''}
          onChange={(e) => handleInputChange('growthRate', parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="ebitdaMargin">EBITDA Margin (%)</Label>
        <Input
          id="ebitdaMargin"
          type="number"
          value={modelData.ebitdaMargin || ''}
          onChange={(e) => handleInputChange('ebitdaMargin', parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="discountRate">Discount Rate (%)</Label>
        <Input
          id="discountRate"
          type="number"
          value={modelData.discountRate || ''}
          onChange={(e) => handleInputChange('discountRate', parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>
    </div>
  )

  const renderLBOInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="purchasePrice">Purchase Price ($M)</Label>
        <Input
          id="purchasePrice"
          type="number"
          value={modelData.purchasePrice || ''}
          onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="debtRatio">Debt Ratio (%)</Label>
        <Input
          id="debtRatio"
          type="number"
          value={modelData.debtRatio || ''}
          onChange={(e) => handleInputChange('debtRatio', parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="exitMultiple">Exit Multiple (EV/EBITDA)</Label>
        <Input
          id="exitMultiple"
          type="number"
          value={modelData.exitMultiple || ''}
          onChange={(e) => handleInputChange('exitMultiple', parseFloat(e.target.value) || 0)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="holdPeriod">Hold Period (Years)</Label>
        <Select value={modelData.holdPeriod?.toString() || ''} onValueChange={(value) => handleInputChange('holdPeriod', parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select hold period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 Years</SelectItem>
            <SelectItem value="4">4 Years</SelectItem>
            <SelectItem value="5">5 Years</SelectItem>
            <SelectItem value="6">6 Years</SelectItem>
            <SelectItem value="7">7 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderScenarioInputs = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center font-medium text-neutral-700">Bear Case</div>
        <div className="text-center font-medium text-neutral-700">Base Case</div>
        <div className="text-center font-medium text-neutral-700">Bull Case</div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          placeholder="Pessimistic"
          type="number"
          value={modelData.bearCase || ''}
          onChange={(e) => handleInputChange('bearCase', parseFloat(e.target.value) || 0)}
        />
        <Input
          placeholder="Most likely"
          type="number"
          value={modelData.baseCase || ''}
          onChange={(e) => handleInputChange('baseCase', parseFloat(e.target.value) || 0)}
        />
        <Input
          placeholder="Optimistic"
          type="number"
          value={modelData.bullCase || ''}
          onChange={(e) => handleInputChange('bullCase', parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  )

  const renderCustomInputs = () => (
    <div className="space-y-4">
      {Object.entries(template || {}).map(([key, defaultValue]) => (
        <div key={key}>
          <Label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
          <Input
            id={key}
            type="number"
            value={modelData[key] || ''}
            onChange={(e) => handleInputChange(key, parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
      ))}
    </div>
  )

  const renderCalculations = () => (
    <div className="space-y-3">
      <h4 className="font-medium text-neutral-900">Calculated Values</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(calculatedValues).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center p-3 bg-neutral-50 rounded">
            <span className="text-sm font-medium text-neutral-700">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
            </span>
            <span className="text-sm font-mono text-neutral-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          </div>
        ))}
      </div>
      
      {Object.entries(errors).map(([key, error]) => (
        <div key={key} className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      ))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              {title}
            </CardTitle>
            <CardDescription>
              {modelType.toUpperCase()} Model • {Object.keys(modelData).length} inputs
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Model Inputs */}
        <div>
          <h4 className="font-medium text-neutral-900 mb-3">Model Inputs</h4>
          {renderModelInputs()}
        </div>
        
        {/* Calculated Values */}
        {Object.keys(calculatedValues).length > 0 && renderCalculations()}
        
        {/* Validation Status */}
        <div className={`p-3 rounded-lg ${validateModel(modelData, errors) ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">
              Model Status: {validateModel(modelData, errors) ? 'Valid' : 'Incomplete'}
            </span>
          </div>
          {!validateModel(modelData, errors) && (
            <p className="text-xs mt-1">
              Please complete all required fields to proceed.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
