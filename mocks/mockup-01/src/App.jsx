import { useEffect, useMemo, useState } from 'react'
import {
  DEMO_SEEDS,
  PHASES,
  QUESTION_BANKS,
  RESULTS,
  buildHistory,
  detectRoute,
} from './data/paths'
import { STATES, citiesFor, defaultCityFor } from './data/locations'
import { saveLead, removeLeadsByIdentity } from './data/store'

const PHASE_ORDER = ['complaint', 'questions', 'result', 'help']

function phaseIndex(step) {
  if (step === 'analyzing') return 1
  if (step === 'success' || step === 'privacy' || step === 'privacy-done') return 3
  const idx = PHASE_ORDER.indexOf(step)
  return idx < 0 ? 0 : idx
}

function StepProgress({ step, visible }) {
  if (!visible) return null
  const current = phaseIndex(step)
  return (
    <nav className="step-progress" aria-label="Etapas">
      {PHASES.map((phase, i) => {
        const state = i < current ? 'is-done' : i === current ? 'is-current' : ''
        return (
          <div
            key={phase.id}
            className={`step-progress__item ${state}`}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="step-progress__num">{String(i + 1).padStart(2, '0')}</span>
            <span className="step-progress__label">{phase.label}</span>
            {i === current ? (
              <span key={`c-${current}`} className="step-progress__cascade" aria-hidden="true" />
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export default function App() {
  const [step, setStep] = useState('landing')
  const [complaint, setComplaint] = useState('')
  const [seedId, setSeedId] = useState(null)
  const [route, setRoute] = useState(null)
  const [answers, setAnswers] = useState({})
  const [qIndex, setQIndex] = useState(0)
  const [help, setHelp] = useState({
    name: '',
    phone: '',
    state: 'SP',
    city: defaultCityFor('SP'),
    prefer: 'whatsapp',
    consent: false,
  })
  const [formError, setFormError] = useState('')
  const [complaintError, setComplaintError] = useState('')
  const [historyText, setHistoryText] = useState('')
  const [submittedProfile, setSubmittedProfile] = useState(null)
  const [privacy, setPrivacy] = useState({ name: '', phone: '' })
  const [privacyError, setPrivacyError] = useState('')
  const [privacyResult, setPrivacyResult] = useState(null)

  const questions = useMemo(() => {
    if (!route || !QUESTION_BANKS[route]) return []
    return QUESTION_BANKS[route]
  }, [route])

  const result = route ? RESULTS[route] : null
  const cityOptions = useMemo(() => citiesFor(help.state), [help.state])
  const showSteps = step !== 'landing' && step !== 'privacy' && step !== 'privacy-done'

  useEffect(() => {
    if (step !== 'analyzing') return undefined
    const t = window.setTimeout(() => setStep('result'), 1400)
    return () => window.clearTimeout(t)
  }, [step])

  function applySeed(seed) {
    setSeedId(seed.id)
    setComplaint(seed.text)
    setComplaintError('')
  }

  function onStateChange(uf) {
    setHelp((h) => ({
      ...h,
      state: uf,
      city: defaultCityFor(uf),
    }))
  }

  function continueFromComplaint() {
    const detected = detectRoute(complaint)
    if (detected === 'short') {
      setComplaintError('Conte um pouco mais: o que sente, há quanto tempo e o que mais preocupa você.')
      return
    }
    setComplaintError('')
    setRoute(detected)
    setAnswers({})
    setQIndex(0)
    const bank = QUESTION_BANKS[detected]
    if (bank?.length) {
      const presets = {}
      bank.forEach((q) => {
        presets[q.id] = q.suggested
      })
      setAnswers(presets)
    }
    if (detected === 'excluded') {
      setStep('analyzing')
      return
    }
    setStep('questions')
  }

  function selectAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function nextQuestion() {
    const current = questions[qIndex]
    if (!answers[current.id]) return
    if (qIndex >= questions.length - 1) {
      setStep('analyzing')
      return
    }
    setQIndex((i) => i + 1)
  }

  function prevQuestion() {
    if (qIndex === 0) {
      setStep('complaint')
      return
    }
    setQIndex((i) => i - 1)
  }

  function submitHelp(e) {
    e.preventDefault()
    if (!help.consent) {
      setFormError('Para enviar, é necessário aceitar o contato da equipe.')
      return
    }
    if (!help.name.trim() || !help.phone.trim() || !help.city || !help.state) {
      setFormError('Preencha nome, telefone, estado e cidade.')
      return
    }
    setFormError('')
    const history = buildHistory({
      complaint,
      route,
      answers,
      questions,
      result,
    })
    const stateName = STATES.find((s) => s.uf === help.state)?.name || help.state
    const summary = [
      `Nome: ${help.name.trim()}`,
      `Telefone: ${help.phone.trim()}`,
      `Local: ${help.city} / ${stateName}`,
      `Preferência de contato: ${help.prefer === 'whatsapp' ? 'WhatsApp' : 'Ligação'}`,
      '',
      history,
    ].join('\n')

    saveLead({
      name: help.name.trim(),
      phone: help.phone.trim(),
      state: help.state,
      city: help.city,
      prefer: help.prefer,
      complaint,
      route,
      answers,
      history: summary,
    })

    setHistoryText(summary)
    setSubmittedProfile({ name: help.name.trim(), phone: help.phone.trim() })
    setStep('success')
  }

  function resetFlow() {
    setStep('landing')
    setComplaint('')
    setSeedId(null)
    setRoute(null)
    setAnswers({})
    setQIndex(0)
    setHelp({
      name: '',
      phone: '',
      state: 'SP',
      city: defaultCityFor('SP'),
      prefer: 'whatsapp',
      consent: false,
    })
    setFormError('')
    setComplaintError('')
    setHistoryText('')
    setSubmittedProfile(null)
    setPrivacy({ name: '', phone: '' })
    setPrivacyError('')
    setPrivacyResult(null)
  }

  function openPrivacy() {
    setPrivacy({
      name: submittedProfile?.name || '',
      phone: submittedProfile?.phone || '',
    })
    setPrivacyError('')
    setPrivacyResult(null)
    setStep('privacy')
  }

  function submitPrivacy(e) {
    e.preventDefault()
    if (!privacy.name.trim() || !privacy.phone.trim()) {
      setPrivacyError('Informe nome completo e telefone para localizar e remover seus dados.')
      return
    }
    const { removed } = removeLeadsByIdentity(privacy.name, privacy.phone)
    setPrivacyResult({ removed, name: privacy.name.trim(), phone: privacy.phone.trim() })
    setStep('privacy-done')
  }

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true" />
      <header className="site-header">
        <div className="site-header__inner">
          <p className="wordmark">Dr. Rocha</p>
          <p className="site-header__meta">Orientação · não é diagnóstico</p>
        </div>
      </header>
      <div className="site">
        <StepProgress step={step} visible={showSteps} />

        <main className="site-main">
          {step === 'landing' && (
            <section className="stage stage-landing" aria-labelledby="landing-title">
              <div className="hero-layout">
                <div className="hero-copy">
                  <h1 id="landing-title" className="headline">
                    Não sabe qual <span className="headline-accent">médico</span> procurar?
                  </h1>
                  <p className="lede">
                    Dor abdominal é gastro? Dor nas articulações é ortopedista ou reumatologista? Conte
                    o que está acontecendo e receba uma orientação sobre o próximo passo mais adequado.
                  </p>
                  <ul className="landing-points">
                    <li>Gratuito</li>
                    <li>Poucos minutos</li>
                    <li>Sem cadastro para começar</li>
                  </ul>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-totem"
                      onClick={() => setStep('complaint')}
                    >
                      Começar
                    </button>
                  </div>
                </div>
                <div className="hero-visual">
                  <img
                    className="hero-photo"
                    src={`${import.meta.env.BASE_URL}hero-medical.jpg`}
                    alt="Instrumentos clínicos em ambiente de atendimento"
                    width="720"
                    height="900"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 'complaint' && (
            <section className="stage" aria-labelledby="complaint-title">
              <h1 id="complaint-title" className="headline" style={{ maxWidth: '16ch' }}>
                O que está acontecendo?
              </h1>
              <p className="lede">Conte com suas palavras o que você está sentindo ou o que está preocupando você.</p>

              <div className="seed-block">
                <p className="seed-note">
                  As sugestões abaixo existem apenas neste protótipo, como exemplos de entrada para
                  percorrer os caminhos (eletivo, urgente ou indeterminado).
                </p>
                <div className="seed-row" role="group" aria-label="Exemplos de entrada do protótipo">
                  {DEMO_SEEDS.map((seed) => (
                    <button
                      key={seed.id}
                      type="button"
                      className={`seed ${seedId === seed.id ? 'is-active' : ''}`}
                      onClick={() => applySeed(seed)}
                    >
                      {seed.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <label className="label" htmlFor="complaint">
                  Sua queixa
                </label>
                <textarea
                  id="complaint"
                  className={`textarea ${complaintError ? 'is-error' : ''}`}
                  value={complaint}
                  onChange={(e) => {
                    setComplaint(e.target.value)
                    setSeedId(null)
                    setComplaintError('')
                  }}
                  placeholder="Ex.: Estou há uns dois meses com muita dor na barriga depois de comer…"
                />
                {complaintError ? <p className="error">{complaintError}</p> : null}
                <p className="hint">Gratuito · poucos minutos · sem cadastro neste passo</p>
              </div>

              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep('landing')}>
                  Voltar
                </button>
                <button type="button" className="btn btn-primary" onClick={continueFromComplaint}>
                  Continuar
                </button>
              </div>
            </section>
          )}

          {step === 'questions' && questions[qIndex] && (
            <section className="stage" aria-labelledby="q-title">
              <div className="progress-inline">
                <span>
                  Pergunta {qIndex + 1} de {questions.length}
                </span>
              </div>
              <h1 id="q-title" className="question-title">
                {questions[qIndex].prompt}
              </h1>
              <div className="option-grid" role="listbox" aria-label="Opções de resposta">
                {questions[qIndex].options.map((opt) => {
                  const selected = answers[questions[qIndex].id] === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`option ${selected ? 'is-selected' : ''}`}
                      onClick={() => selectAnswer(questions[qIndex].id, opt)}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={prevQuestion}>
                  Voltar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!answers[questions[qIndex].id]}
                  onClick={nextQuestion}
                >
                  {qIndex >= questions.length - 1 ? 'Ver orientação' : 'Próxima'}
                </button>
              </div>
            </section>
          )}

          {step === 'analyzing' && (
            <section className="stage analyzing" aria-live="polite" aria-busy="true">
              <h1 className="question-title">Organizando sua orientação…</h1>
              <p className="lede" style={{ marginBottom: 0 }}>
                Cruzando a queixa com as respostas para sugerir o próximo passo — sem fechar diagnóstico.
              </p>
              <div className="analyzing__bar" aria-hidden="true">
                <span />
              </div>
            </section>
          )}

          {step === 'result' && result?.kind === 'urgent' && (
            <section className="stage" aria-labelledby="urgent-title">
              <h1 id="urgent-title" className="headline" style={{ maxWidth: '14ch' }}>
                {result.title}
              </h1>
              <div className="banner banner-urgent">
                <p style={{ margin: 0 }}>{result.body}</p>
              </div>
              <p className="disclaimer">
                O fluxo de agendamento eletivo foi encerrado por segurança. Procure atendimento de
                urgência agora.
              </p>
              <div className="actions">
                <button type="button" className="btn btn-danger" onClick={resetFlow}>
                  Entendi
                </button>
              </div>
            </section>
          )}

          {step === 'result' && result?.kind === 'elective' && (
            <section className="stage" aria-labelledby="result-title">
              <h1 id="result-title" className="specialty">
                {result.specialty}
              </h1>
              <p className="lede">{result.body}</p>
              <div className="panel">
                <strong>Também pode haver relação com:</strong>
                <ul className="alt-list">
                  {result.alternatives.map((alt) => (
                    <li key={alt}>{alt}</li>
                  ))}
                </ul>
                <p className="disclaimer">
                  Isso não significa que você tenha um diagnóstico específico. A indicação considera o
                  tipo de queixa relatada e qual profissional costuma ser mais adequado para iniciar a
                  investigação. O Dr. Rocha faz navegação, não diagnóstico.
                </p>
              </div>

              <h2 className="question-title" style={{ fontSize: '1.7rem', marginTop: '2rem' }}>
                Ainda está em dúvida sobre o que fazer?
              </h2>
              <p className="lede">
                Se quiser, sua avaliação pode ser encaminhada à equipe para ajudar a encontrar o próximo
                passo — inclusive para agendar.
              </p>
              <div className="choice-pair">
                <button
                  type="button"
                  className="choice-card choice-card--primary"
                  onClick={() => setStep('help')}
                >
                  <strong>Quero ajuda</strong>
                  <span>Deixe seu contato e envie o histórico da avaliação.</span>
                </button>
                <button type="button" className="choice-card" onClick={resetFlow}>
                  <strong>Não, obrigado</strong>
                  <span>Encerrar por aqui. Você já recebeu a orientação.</span>
                </button>
              </div>
            </section>
          )}

          {step === 'result' && result?.kind === 'indeterminate' && (
            <section className="stage" aria-labelledby="indet-title">
              <h1 id="indet-title" className="headline" style={{ maxWidth: '16ch' }}>
                {result.title}
              </h1>
              <div className="banner banner-neutral">
                <p style={{ margin: 0 }}>{result.body}</p>
              </div>
              <div className="choice-pair" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="choice-card choice-card--primary"
                  onClick={() => setStep('help')}
                >
                  <strong>Pedir avaliação humana</strong>
                  <span>Enviar contato e histórico para a equipe.</span>
                </button>
                {route === 'short' ? (
                  <button type="button" className="choice-card" onClick={() => setStep('complaint')}>
                    <strong>Completar a queixa</strong>
                    <span>Voltar e descrever com mais detalhe.</span>
                  </button>
                ) : (
                  <button type="button" className="choice-card" onClick={resetFlow}>
                    <strong>Nova avaliação</strong>
                    <span>Começar outra orientação.</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {step === 'help' && (
            <section className="stage" aria-labelledby="help-title">
              <h1 id="help-title" className="headline" style={{ maxWidth: '14ch' }}>
                Enviar minha avaliação
              </h1>
              <p className="lede">
                Se quiser ajuda para o próximo passo, deixe seus dados. A equipe entra em contato pela
                preferência escolhida.
              </p>
              <form className="panel" onSubmit={submitHelp} noValidate>
                <div className="form-grid two">
                  <div>
                    <label className="label" htmlFor="name">
                      Nome completo
                    </label>
                    <input
                      id="name"
                      className="field"
                      value={help.name}
                      onChange={(e) => setHelp((h) => ({ ...h, name: e.target.value }))}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="phone">
                      Telefone
                    </label>
                    <input
                      id="phone"
                      className="field"
                      value={help.phone}
                      onChange={(e) => setHelp((h) => ({ ...h, phone: e.target.value }))}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 90000-0000"
                    />
                  </div>
                </div>
                <div className="form-grid two" style={{ marginTop: '1rem' }}>
                  <div>
                    <label className="label" htmlFor="state">
                      Estado
                    </label>
                    <select
                      id="state"
                      className="field"
                      value={help.state}
                      onChange={(e) => onStateChange(e.target.value)}
                    >
                      {STATES.map((s) => (
                        <option key={s.uf} value={s.uf}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="city">
                      Cidade
                    </label>
                    <select
                      id="city"
                      className="field"
                      value={help.city}
                      onChange={(e) => setHelp((h) => ({ ...h, city: e.target.value }))}
                    >
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label className="label" htmlFor="prefer">
                    Prefere contato
                  </label>
                  <select
                    id="prefer"
                    className="field"
                    value={help.prefer}
                    onChange={(e) => setHelp((h) => ({ ...h, prefer: e.target.value }))}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call">Ligação</option>
                  </select>
                </div>
                <label className="check" style={{ marginTop: '1.15rem' }}>
                  <input
                    type="checkbox"
                    checked={help.consent}
                    onChange={(e) => {
                      setHelp((h) => ({ ...h, consent: e.target.checked }))
                      setFormError('')
                    }}
                  />
                  <span>
                    Autorizo o contato da equipe com base nesta avaliação e o envio do histórico da
                    interação para agilizar o atendimento.
                  </span>
                </label>
                {formError ? <p className="error">{formError}</p> : null}
                <div className="actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep('result')}>
                    Voltar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!help.consent}>
                    Enviar
                  </button>
                </div>
              </form>
            </section>
          )}

          {step === 'success' && (
            <section className="stage" aria-labelledby="success-title">
              <h1 id="success-title" className="headline" style={{ maxWidth: '16ch' }}>
                Solicitação recebida
              </h1>
              <div className="banner banner-ok">
                <p style={{ margin: 0 }}>
                  Suas informações foram registradas com proteção e cuidado. Enviamos um e-mail com o
                  resumo desta solicitação para o endereço associado ao seu contato, quando disponível.
                  Nossa equipe analisará sua avaliação e retornará pela preferência indicada.
                </p>
              </div>

              <div className="panel" style={{ marginTop: '1rem' }}>
                <strong>Resumo enviado</strong>
                <pre className="history-block">{historyText}</pre>
              </div>

              <div className="privacy-card">
                <p>
                  Você pode solicitar a remoção dos seus dados a qualquer momento por este{' '}
                  <button type="button" className="text-link" onClick={openPrivacy}>
                    link de exclusão
                  </button>{' '}
                  ou pelo e-mail{' '}
                  <a className="text-link" href="mailto:contato@drrocha.com">
                    contato@drrocha.com
                  </a>
                  . Para consultar quais dados temos associados ao seu nome, envie um e-mail para o
                  mesmo endereço.
                </p>
              </div>

              <div className="actions">
                <button type="button" className="btn btn-primary" onClick={resetFlow}>
                  Voltar ao início
                </button>
              </div>
            </section>
          )}

          {step === 'privacy' && (
            <section className="stage" aria-labelledby="privacy-title">
              <h1 id="privacy-title" className="headline" style={{ maxWidth: '18ch' }}>
                Remoção de dados
              </h1>
              <p className="lede">
                Informe o nome completo e o telefone usados na solicitação. Todos os registros
                relacionados a este conjunto serão removidos.
              </p>
              <form className="panel" onSubmit={submitPrivacy} noValidate>
                <div className="form-grid two">
                  <div>
                    <label className="label" htmlFor="privacy-name">
                      Nome completo
                    </label>
                    <input
                      id="privacy-name"
                      className="field"
                      value={privacy.name}
                      onChange={(e) => setPrivacy((p) => ({ ...p, name: e.target.value }))}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="privacy-phone">
                      Telefone
                    </label>
                    <input
                      id="privacy-phone"
                      className="field"
                      value={privacy.phone}
                      onChange={(e) => setPrivacy((p) => ({ ...p, phone: e.target.value }))}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                {privacyError ? <p className="error">{privacyError}</p> : null}
                <p className="hint" style={{ marginTop: '1rem' }}>
                  Para consultar dados associados ao seu nome, envie um e-mail para{' '}
                  <a className="text-link" href="mailto:contato@drrocha.com">
                    contato@drrocha.com
                  </a>
                  .
                </p>
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setStep(historyText ? 'success' : 'landing')}
                  >
                    Voltar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Remover meus dados
                  </button>
                </div>
              </form>
            </section>
          )}

          {step === 'privacy-done' && (
            <section className="stage" aria-labelledby="privacy-done-title">
              <h1 id="privacy-done-title" className="headline" style={{ maxWidth: '16ch' }}>
                Dados removidos
              </h1>
              <div className="banner banner-ok">
                <p style={{ margin: 0 }}>
                  {privacyResult?.removed > 0
                    ? `Removemos ${privacyResult.removed} registro(s) vinculados a ${privacyResult.name} e ao telefone informado.`
                    : `Não encontramos registros ativos para ${privacyResult?.name || 'os dados informados'} e o telefone indicado. Se precisar de uma consulta, escreva para contato@drrocha.com.`}
                </p>
              </div>
              <p className="disclaimer">
                A confirmação desta remoção também pode ser solicitada por e-mail em{' '}
                <a className="text-link" href="mailto:contato@drrocha.com">
                  contato@drrocha.com
                </a>
                .
              </p>
              <div className="actions">
                <button type="button" className="btn btn-primary" onClick={resetFlow}>
                  Voltar ao início
                </button>
              </div>
            </section>
          )}
        </main>

        <footer className="site-footer">
          <button type="button" className="text-link footer-link" onClick={openPrivacy}>
            Remoção de dados
          </button>
          <span className="footer-sep" aria-hidden="true">
            ·
          </span>
          <a className="text-link footer-link" href="mailto:contato@drrocha.com">
            contato@drrocha.com
          </a>
        </footer>
      </div>
    </div>
  )
}
