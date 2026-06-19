import BrandLogo from '../Brand/BrandLogo';

const APHORISMS = [
  {
    text: 'Those who have knowledge, do not predict. Those who predict do not have knowledge.',
    author: 'Lao Tsu',
  },
  {
    text: 'Less is more.',
    author: 'Ludwig Mies van der Rohe',
  },
  {
    text: 'The question is, can we change our course in time?',
    author: 'Leonardo DiCaprio',
  },
  {
    text: 'Measure what is measurable, and make measurable what is not so.',
    author: 'Galileo Galilei',
  },
  {
    text: 'It is harder to crack a prejudice than an atom.',
    author: 'Albert Einstein',
  },
  {
    text: 'The value of an idea lies in its usage.',
    author: 'Thomas Edison',
  },
  {
    text: 'The best time of the day is now.',
    author: 'Pierre Bonnard',
  },
  {
    text: "Imagination is everything. It is the preview of life's coming attractions.",
    author: 'Albert Einstein',
  },
  {
    text: "Don't find fault, find a remedy.",
    author: 'Henry Ford',
  },
  {
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: 'Steve Jobs',
  },
  {
    text: 'Logic will get you from A to B. Imagination will take you everywhere.',
    author: 'Albert Einstein',
  },
  {
    text: 'Simplicity is prerequisite for reliability.',
    author: 'Edsger W. Dijkstra',
  },
  {
    text: 'First, solve the problem. Then, write the code.',
    author: 'John Johnson',
  },
  {
    text: 'Make it work, make it right, make it fast.',
    author: 'Kent Beck',
  },
];

const getRandomAphorism = () => APHORISMS[Math.floor(Math.random() * APHORISMS.length)];

function BootstrapScreen({
  eyebrow = 'Focusly',
  title = 'Preparing Focusly',
  status = 'Loading workspace',
  detail = 'Almost ready',
}) {
  return (
    <main className="bootstrap-screen">
      <section className="bootstrap-screen__card">
        <div className="bootstrap-screen__glow" aria-hidden="true" />
        <div className="bootstrap-screen__logo-shell">
          <BrandLogo
            subtitle="Focus Workspace"
            orientation="stacked"
            size="lg"
            animated
            className="bootstrap-screen__brand"
          />
        </div>

        <div className="bootstrap-screen__copy">
          <span className="bootstrap-screen__eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <div className="bootstrap-screen__status-row" aria-label="Loading status">
            <span className="bootstrap-screen__status-pill is-active">{status}</span>
            <span className="bootstrap-screen__status-pill">{detail}</span>
          </div>
        </div>

        <div className="bootstrap-screen__progress" aria-hidden="true">
          <span className="bootstrap-screen__progress-bar" />
        </div>

      </section>
    </main>
  );
}

export { getRandomAphorism };
export default BootstrapScreen;
