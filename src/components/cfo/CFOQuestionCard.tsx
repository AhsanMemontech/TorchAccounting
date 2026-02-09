import { useState } from "react"

export function CFOQuestionCard({ question }: any) {
    const [answer, setAnswer] = useState("")
  
    const submitAnswer = async () => {
      await fetch("/api/cfo/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: question.id,
          answer
        })
      })
    }
  
    return (
      <div className="border rounded p-4 bg-yellow-50">
        <h4 className="font-semibold">{question.title}</h4>
        <p className="text-sm text-gray-700">{question.message}</p>
  
        <textarea
          className="w-full mt-2 border p-2"
          placeholder="Explain what happened…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
  
        <button
          onClick={submitAnswer}
          className="mt-2 px-3 py-1 bg-black text-white rounded"
        >
          Submit Answer
        </button>
      </div>
    )
  }  