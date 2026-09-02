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
import { HeroIllustration } from './components/HeroIllustration'

const PHASE_ORDER = ['complaint', 'questions', 'result', 'help']

function phaseIndex(step) {
  if (step === 'analyzing') return 1
  if (step === 'success' || step === 'privacy' || step === 'privacy-done') return 3
  const idx = PHASE_ORDER.indexOf(step)
  return idx < 0 ? 0 : idx
}

function StepProgress({ step, visible, helpDisabled }) {
  if (!visible) return null
  const current = phaseIndex(step)
  return (
    <nav className="step-progress" aria-label="Etapas">
      {PHASES.map((phase, i) => {
        let state = i < current ? 'is-done' : i === current ? 'is-current' : ''
        if (phase.id === 'help' && helpDisabled) {
          state = 'is-disabled'
        }
        return (
          <div
            key={phase.id}
            className={`step-progress__item ${state}`}
            aria-current={i === current ? 'step' : undefined}
            aria-disabled={phase.id === 'help' && helpDisabled ? true : undefined}
          >
            <span className="step-progress__num">{i + 1}</span>
            <span className="step-progress__label">{phase.label}</span>
          </div>
        )
      })}
    </nav>
  )
}

function Split({ info, action }) {
  return (
    <div className="split">
      <div className="split__info">{info}</div>
      <aside className="split__action">{action}</aside>
    </div>
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
  const [footerOpen, setFooterOpen] = useState(false)

  const questions = useMemo(() => {
    if (!route || !QUESTION_BANKS[route]) return []
    return QUESTION_BANKS[route]
  }, [route])

  const result = route ? RESULTS[route] : null
  const cityOptions = useMemo(() => citiesFor(help.state), [help.state])
  const showSteps = step !== 'landing' && step !== 'privacy' && step !== 'privacy-done'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step, qIndex])

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
    if (detected === 'excluded') {
      setStep('analyzing')
      return
    }
    setStep('questions')
  }

  function selectAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (qIndex >= questions.length - 1) {
      setStep('analyzing')
      return
    }
    setQIndex((i) => i + 1)
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
      <header className="site-header">
        <div className="site-header__inner">
          <p className="wordmark">Dr. Rocha</p>
          <p className="site-header__meta">Orientação · não é diagnóstico</p>
        </div>
      </header>

      <div className="site">
        <StepProgress
          step={step}
          visible={showSteps}
          helpDisabled={step === 'result' && result?.kind === 'urgent'}
        />

        <main className="site-main">
          {step === 'landing' && (
            <section className="stage stage-landing" aria-labelledby="landing-title">
              <div className="hero-layout">
                <div className="hero-copy">
                  <div className="hero-kicker-row" aria-hidden="true">
                    <span className="hero-dot">1</span>
                    <span className="hero-dot">2</span>
                    <span className="hero-dot">3</span>
                  </div>
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
                </div>
                <div className="hero-visual">
                  <HeroIllustration />
                  <div className="hero-cta">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setStep('complaint')}
                    >
                      Começar
                    </button>
                    <p className="hero-cta__hint">Descubra aqui o médico que você precisa!</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 'complaint' && (
            <section className="stage stage-wide" aria-labelledby="complaint-title">
              <Split
                info={
                  <>
                    <h1 id="complaint-title" className="headline headline--flow">
                      O que está acontecendo?
                    </h1>
                    <p className="lede">
                      Conte com suas palavras o que você está sentindo ou o que está preocupando você.
                    </p>
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
                  </>
                }
                action={
                  <div className="action-card">
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
                    <div className="actions actions--stack">
                      <button type="button" className="btn btn-primary" onClick={continueFromComplaint}>
                        Continuar
                      </button>
                    </div>
                  </div>
                }
              />
            </section>
          )}

          {step === 'questions' && questions[qIndex] && (
            <section className="stage stage-wide" aria-labelledby="q-title">
              <Split
                info={
                  <>
                    <div className="progress-inline">
                      <span>
                        Pergunta {qIndex + 1} de {questions.length}
                      </span>
                    </div>
                    <h1 id="q-title" className="question-title">
                      {questions[qIndex].prompt}
                    </h1>
                    <p className="lede">Escolha a opção que melhor descreve sua situação.</p>
                  </>
                }
                action={
                  <div className="action-card action-card--compact">
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
                    <div className="actions actions--stack">
                      {answers[questions[qIndex].id] ? (
                        <button type="button" className="btn btn-primary" onClick={nextQuestion}>
                          {qIndex >= questions.length - 1 ? 'Ver orientação' : 'Próxima'}
                        </button>
                      ) : null}
                      <button type="button" className="btn btn-ghost" onClick={prevQuestion}>
                        Voltar
                      </button>
                    </div>
                  </div>
                }
              />
            </section>
          )}

          {step === 'analyzing' && (
            <section className="stage stage-wide analyzing" aria-live="polite" aria-busy="true">
              <Split
                info={
                  <>
                    <h1 className="question-title">Organizando sua orientação…</h1>
                    <p className="lede" style={{ marginBottom: 0 }}>
                      Cruzando a queixa com as respostas para sugerir o próximo passo — sem fechar
                      diagnóstico.
                    </p>
                  </>
                }
                action={
                  <div className="action-card action-card--quiet">
                    <div className="analyzing__bar" aria-hidden="true">
                      <span />
                    </div>
                    <p className="hint">Aguarde alguns segundos…</p>
                  </div>
                }
              />
            </section>
          )}

          {step === 'result' && result?.kind === 'urgent' && (
            <section className="stage stage-wide" aria-labelledby="urgent-title">
              <Split
                info={
                  <>
                    <h1 id="urgent-title" className="headline headline--flow">
                      {result.title}
                    </h1>
                    <p className="disclaimer" style={{ marginTop: '1rem' }}>
                      O fluxo de agendamento eletivo foi encerrado por segurança. Procure atendimento de
                      urgência agora.
                    </p>
                  </>
                }
                action={
                  <div className="action-card">
                    <div className="banner banner-urgent" style={{ margin: 0 }}>
                      <p className="urgent-callout" style={{ margin: 0 }}>
                        {result.highlight}
                      </p>
                    </div>
                    <p className="action-card__text">{result.body}</p>
                  </div>
                }
              />
            </section>
          )}

          {step === 'result' && result?.kind === 'elective' && (
            <section className="stage stage-wide" aria-labelledby="result-title">
              <Split
                info={
                  <>
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
                        Isso não significa que você tenha um diagnóstico específico. A indicação
                        considera o tipo de queixa relatada e qual profissional costuma ser mais adequado
                        para iniciar a investigação. O Dr. Rocha faz navegação, não diagnóstico.
                      </p>
                    </div>
                  </>
                }
                action={
                  <div className="action-card">
                    <p className="action-card__title">Ainda em dúvida?</p>
                    <p className="action-card__text">
                      Encaminhe sua avaliação à equipe para ajudar a encontrar o próximo passo —
                      inclusive para agendar.
                    </p>
                    <div className="choice-stack">
                      <button
                        type="button"
                        className="choice-card choice-card--primary"
                        onClick={() => setStep('help')}
                      >
                        <strong>Quero ajuda</strong>
                        <span>Deixe seu contato e envie o histórico.</span>
                      </button>
                      <button type="button" className="choice-card" onClick={resetFlow}>
                        <strong>Não, obrigado</strong>
                        <span>Encerrar por aqui.</span>
                      </button>
                    </div>
                  </div>
                }
              />
            </section>
          )}

          {step === 'result' && result?.kind === 'indeterminate' && (
            <section className="stage stage-wide" aria-labelledby="indet-title">
              <Split
                info={
                  <>
                    <h1 id="indet-title" className="headline headline--flow">
                      {result.title}
                    </h1>
                    <div className="banner banner-neutral">
                      <p style={{ margin: 0 }}>{result.body}</p>
                    </div>
                  </>
                }
                action={
                  <div className="action-card">
                    <p className="action-card__title">O que deseja fazer?</p>
                    <div className="choice-stack">
                      <button
                        type="button"
                        className="choice-card choice-card--primary"
                        onClick={() => setStep('help')}
                      >
                        <strong>Pedir avaliação humana</strong>
                        <span>Enviar contato e histórico para a equipe.</span>
                      </button>
                      {route === 'short' ? (
                        <button
                          type="button"
                          className="choice-card"
                          onClick={() => setStep('complaint')}
                        >
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
                  </div>
                }
              />
            </section>
          )}

          {step === 'help' && (
            <section className="stage stage-wide" aria-labelledby="help-title">
              <Split
                info={
                  <>
                    <h1 id="help-title" className="headline headline--flow">
                      Enviar minha avaliação
                    </h1>
                    <p className="lede">
                      Se quiser ajuda para o próximo passo, deixe seus dados. A equipe entra em contato
                      pela preferência escolhida.
                    </p>
                    <p className="disclaimer">
                      Nome e telefone só são pedidos depois da orientação — e apenas se você quiser
                      ajuda humana.
                    </p>
                  </>
                }
                action={
                  <form className="action-card" onSubmit={submitHelp} noValidate>
                    <div className="form-grid">
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
                      <div>
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
                    </div>
                    <label className="check" style={{ marginTop: '1rem' }}>
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
                    <div className="actions actions--stack">
                      <button type="submit" className="btn btn-primary" disabled={!help.consent}>
                        Enviar
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setStep('result')}>
                        Voltar
                      </button>
                    </div>
                  </form>
                }
              />
            </section>
          )}

          {step === 'success' && (
            <section className="stage stage-wide" aria-labelledby="success-title">
              <Split
                info={
                  <>
                    <h1 id="success-title" className="headline headline--flow">
                      Solicitação recebida
                    </h1>
                    <div className="banner banner-ok">
                      <p style={{ margin: 0 }}>
                        Suas informações foram registradas com proteção e cuidado. Enviamos um e-mail
                        com o resumo desta solicitação para o endereço associado ao seu contato, quando
                        disponível. Nossa equipe analisará sua avaliação e retornará pela preferência
                        indicada.
                      </p>
                    </div>
                  </>
                }
                action={
                  <div className="action-card">
                    <p className="action-card__title">Resumo enviado</p>
                    <pre className="history-block">{historyText}</pre>
                    <div className="actions actions--stack">
                      <button type="button" className="btn btn-ghost" onClick={resetFlow}>
                        Voltar ao início
                      </button>
                    </div>
                  </div>
                }
              />
            </section>
          )}

          {step === 'privacy' && (
            <section className="stage stage-wide" aria-labelledby="privacy-title">
              <Split
                info={
                  <>
                    <h1 id="privacy-title" className="headline headline--flow">
                      Remoção de dados
                    </h1>
                    <p className="lede">
                      Informe o nome completo e o telefone usados na solicitação. Todos os registros
                      relacionados a este conjunto serão removidos.
                    </p>
                    <p className="hint">
                      Para consultar dados associados ao seu nome, envie um e-mail para{' '}
                      <a className="text-link" href="mailto:contato@drrocha.com">
                        contato@drrocha.com
                      </a>
                      .
                    </p>
                  </>
                }
                action={
                  <form className="action-card" onSubmit={submitPrivacy} noValidate>
                    <div className="form-grid">
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
                    <div className="actions actions--stack">
                      <button type="submit" className="btn btn-primary">
                        Remover meus dados
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setStep(historyText ? 'success' : 'landing')}
                      >
                        Voltar
                      </button>
                    </div>
                  </form>
                }
              />
            </section>
          )}

          {step === 'privacy-done' && (
            <section className="stage stage-wide" aria-labelledby="privacy-done-title">
              <Split
                info={
                  <>
                    <h1 id="privacy-done-title" className="headline headline--flow">
                      Dados removidos
                    </h1>
                    <div className="banner banner-ok">
                      <p style={{ margin: 0 }}>
                        {privacyResult?.removed > 0
                          ? `Removemos ${privacyResult.removed} registro(s) vinculados a ${privacyResult.name} e ao telefone informado.`
                          : `Não encontramos registros ativos para ${privacyResult?.name || 'os dados informados'} e o telefone indicado. Se precisar de uma consulta, escreva para contato@drrocha.com.`}
                      </p>
                    </div>
                  </>
                }
                action={
                  <div className="action-card">
                    <button type="button" className="btn btn-primary btn-block" onClick={resetFlow}>
                      Voltar ao início
                    </button>
                  </div>
                }
              />
            </section>
          )}
        </main>
      </div>

      <footer className={`site-footer ${footerOpen ? 'is-open' : ''}`}>
        <div className="site-footer__inner">
          <button
            type="button"
            className="site-footer__toggle"
            aria-expanded={footerOpen}
            aria-controls="footer-data-info"
            onClick={() => setFooterOpen((open) => !open)}
          >
            Informações sobre dados
            <svg className="site-footer__chevron" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3.2 6.2 8 11l4.8-4.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <p className="site-footer__title">Informações sobre dados</p>
          <div id="footer-data-info" className="site-footer__body">
            <p className="site-footer__policy">
              Nós não armazenamos nenhum dado durante a sua procura, e os seus dados são anonimizados
              antes da utilização de LLMs. Dados pessoais como nome e telefone podem ser requisitados
              apenas após a sua procura, caso você queira nossa ajuda para encontrar um bom médico para
              você.
            </p>
            <p className="site-footer__policy">
              Você pode solicitar a remoção dos seus dados pessoais a qualquer momento através do{' '}
              <button type="button" className="text-link footer-inline" onClick={openPrivacy}>
                link de exclusão
              </button>{' '}
              ou via e-mail em{' '}
              <a className="text-link footer-inline" href="mailto:contato@drrocha.com">
                contato@drrocha.com
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
