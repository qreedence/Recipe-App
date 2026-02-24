"use client"

import { Plus, Trash2, GripVertical } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface StepInstructionsProps {
  steps: string[]
  setSteps: (v: string[]) => void
}

export function StepInstructions({ steps, setSteps }: StepInstructionsProps) {
  function addStep() {
    setSteps([...steps, ""])
  }

  function updateStep(index: number, value: string) {
    const updated = [...steps]
    updated[index] = value
    setSteps(updated)
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium text-foreground mb-1">Instructions</h2>
        <p className="text-xs text-muted-foreground">
          Add each step of your recipe in order.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex items-start gap-1 pt-2.5 shrink-0">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm font-bold text-primary w-5 text-right">
                {i + 1}
              </span>
            </div>
            <Textarea
              value={step}
              onChange={(e) => updateStep(i, e.target.value)}
              placeholder={`Step ${i + 1}...`}
              className="flex-1 min-h-[80px] resize-none"
            />
            <button
              onClick={() => removeStep(i)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0 self-start mt-1"
              aria-label={`Remove step ${i + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addStep} className="self-start">
        <Plus className="h-4 w-4 mr-1" />
        Add Step
      </Button>
    </div>
  )
}
