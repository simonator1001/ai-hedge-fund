"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Badge } from "./badge"

export type AnalystSignal = {
  signal: string
  confidence: number
  reasoning: string | object
}

type AnalystAnalysisTableProps = {
  data: Record<string, AnalystSignal> // { ticker: { signal, confidence, reasoning } }
  analystName: string
}

export function AnalystAnalysisTable({ data, analystName }: AnalystAnalysisTableProps) {
  if (!data || Object.keys(data).length === 0) return <div>No analysis available.</div>
  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2">{analystName}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Reasoning</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(data).map(([ticker, details]) => (
            <TableRow key={ticker}>
              <TableCell>{ticker}</TableCell>
              <TableCell>
                <Badge variant={
                  details.signal === "bullish"
                    ? "default"
                    : details.signal === "bearish"
                    ? "destructive"
                    : "secondary"
                }>
                  {details.signal}
                </Badge>
              </TableCell>
              <TableCell>{details.confidence}%</TableCell>
              <TableCell>
                <pre className="whitespace-pre-wrap text-xs">
                  {typeof details.reasoning === "string"
                    ? details.reasoning
                    : JSON.stringify(details.reasoning, null, 2)}
                </pre>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 