import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getDailyQuestions } from "../domain/dailyQuiz"
import { getDateKey } from "../domain/dateKey"
import { useAppStore } from "../store/useAppStore"

export function DailyQuizPage() {
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const answerQuiz = useAppStore((state) => state.answerQuiz)
  const questions = useMemo(() => getDailyQuestions(dishes), [dishes])
  const date = getDateKey()
  const answers = user.dailyQuiz?.date === date ? user.dailyQuiz.answers : {}
  const answered = questions.filter((question) => answers[question.id]).length
  const [active, setActive] = useState(0)
  const question = questions[active]

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <small>THỬ THÁCH HẰNG NGÀY</small>
        <h1>Đoán món hôm nay</h1>
        <p>Đọc gợi ý, chọn một món. Mỗi câu đúng nhận 1 chìa khóa; tối đa 3 chìa mỗi ngày.</p>
        <strong>{answered}/{questions.length} câu đã chơi · {Math.max(0, questions.length - answered)} lượt còn lại</strong>
      </header>
      {question ? (
        <section className="quiz-board" key={question.id}>
          <div className="quiz-number">CÂU {active + 1} / {questions.length}</div>
          <div className="quiz-mystery" aria-hidden="true">?</div>
          <div className="quiz-hint">“{question.hint}”</div>
          <div className="quiz-options">
            {question.options.map((option) => {
              const picked = answers[question.id]
              const revealed = Boolean(picked)
              return <button
                key={option.id}
                disabled={revealed}
                className={`${revealed && option.id === question.answerId ? "is-correct" : ""} ${picked === option.id && picked !== question.answerId ? "is-wrong" : ""}`}
                onClick={() => answerQuiz(question.id, option.id)}
              >{option.name}</button>
            })}
          </div>
          {answers[question.id] && <p className="quiz-feedback" role="status">
            {answers[question.id] === question.answerId ? "Chính xác! Đã cộng 1 chìa khóa." : `Đáp án: ${question.options.find((item) => item.id === question.answerId)?.name}.`}
          </p>}
          <div className="quiz-navigation">
            {questions.map((item, index) => <button key={item.id} className={active === index ? "is-active" : ""} onClick={() => setActive(index)} aria-label={`Câu ${index + 1}${answers[item.id] ? ", đã chơi" : ""}`}>{answers[item.id] ? "✓" : index + 1}</button>)}
          </div>
        </section>
      ) : <p>Chưa đủ món ăn để tạo thử thách.</p>}
      <Link to="/" className="quiz-back">← Quay về rương</Link>
    </div>
  )
}
