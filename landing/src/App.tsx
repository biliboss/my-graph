import { useEffect, useState } from "react";
import { Button, Card, CardContent } from "@heroui/react";

type Theme = "aura" | "tokyo";

const BASE = import.meta.env.BASE_URL;

const slides = [
  {
    src: `${BASE}shots/spaghetti-shop.png`,
    kicker: "CÓDIGO RUIM",
    title: "Parece bagunçado.",
    copy: "3 ciclos, 18 arestas, cinco irmãos chamados utils, helpers, common, shared e misc. Ninguém refatora o que não consegue ver.",
  },
  {
    src: `${BASE}shots/layered-shop.png`,
    kicker: "CÓDIGO BOM",
    title: "Parece organizado.",
    copy: "A mesma loja, em camadas. A diferença entre os dois é visível antes de ser legível — e o reports pálido confessa que ainda é rascunho.",
  },
  {
    src: `${BASE}shots/morning-routine.png`,
    kicker: "ROTINA BAGUNÇADA",
    title: "Também dá pra mapear.",
    copy: "Vida real não tem compilador: a seta é tracejada porque é declarada, não verificada. E o celular como hub do dia inteiro aparece sem ninguém precisar dizer.",
  },
  {
    src: `${BASE}shots/family-business.png`,
    kicker: "EMPRESA DE FAMÍLIA",
    title: "O gargalo tem nome.",
    copy: "Quando tudo passa pelo Seu Joaquim, o grafo mostra o gargalo antes da crise. O site, pálido, é o 'um dia a gente faz' — rascunho assumido.",
  },
  {
    src: `${BASE}shots/my-system.png`,
    kicker: "O SISTEMA ONDE ELE NASCEU",
    title: "A primeira árvore foi a do my.",
    copy: "O my-graph nasceu dentro do my, o sistema operacional pessoal local-first: cada sistema é um círculo, cada verbo de cada interface a um clique.",
  },
];

const inks: Array<[string, string, string, string]> = [
  ["→", "Seta sólida", "import type — lido do código-fonte, não da memória", "import"],
  ["⇢", "Seta tracejada", "//! depends_on: — um comentário, e nada o verifica", "comment"],
  ["◉", "Círculo vivo", "um sistema que documenta código que roda", "roda"],
  ["○", "Círculo pálido", "rascunho: nada implementado atrás dele ainda", "draft"],
  ["◌", "Círculo cinza", "caminho citado de fora da árvore — desligado por padrão", "externo"],
];

function Arrow({ down = false }: { down?: boolean }) {
  return <span aria-hidden="true">{down ? "↓" : "↗"}</span>;
}

function Carousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  const slide = slides[index];

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Exemplos reais renderizados pelo my-graph"
    >
      <figure className="carousel-figure">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={`${s.kicker} — ${s.title}`}
            className={i === index ? "active" : ""}
            aria-hidden={i !== index}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </figure>
      <div className="carousel-side">
        <div className="carousel-copy" aria-live="polite">
          <span className="card-number">{slide.kicker}</span>
          <h3>{slide.title}</h3>
          <p>{slide.copy}</p>
        </div>
        <div className="carousel-controls">
          <button aria-label="Anterior" onClick={() => setIndex((index - 1 + slides.length) % slides.length)}>←</button>
          <div className="carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.src}
                aria-label={`Slide ${i + 1}: ${s.kicker}`}
                className={i === index ? "active" : ""}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button aria-label="Próximo" onClick={() => setIndex((index + 1) % slides.length)}>→</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem("my-theme") as Theme) || "aura",
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("my-theme", theme);
  }, [theme]);

  return (
    <main>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="nav shell" aria-label="Navegação principal">
        <a className="brand" href="#top" aria-label="my-graph, início">
          <span className="brand-mark">g</span><span>my-graph</span>
        </a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
          <span /> <span />
        </button>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#prova">Prova</a>
          <a href="#mecanismo">Mecanismo</a>
          <a href="#evidencia">Evidência</a>
          <a href="#familia">Família</a>
          <a href="https://github.com/biliboss/my-graph" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
        </div>
        <div className="theme-switch" aria-label="Tema visual">
          <button className={theme === "aura" ? "active" : ""} onClick={() => setTheme("aura")}>Aura</button>
          <button title="Tokyo Night" className={theme === "tokyo" ? "active" : ""} onClick={() => setTheme("tokyo")}>Tokyo</button>
        </div>
      </nav>

      <header className="hero shell" id="top">
        <div className="eyebrow"><span className="pulse" /> lido do código · nenhuma seta à mão · família my</div>
        <h1>Seu diagrama de arquitetura<br /><em>está mentindo.</em></h1>
        <p className="hero-line">A verdade está no código.</p>
        <p className="hero-copy">
          <strong>my-graph</strong> aponta para uma árvore de sistemas, lê o <code>interface.ts</code> de cada um
          e desenha quem depende de quem — cada verbo de cada interface a um clique.
          Nada é desenhado à mão. Uma figura velha fica <strong>detectável</strong>, não discutível.
        </p>
        <div className="hero-actions">
          <a href="https://github.com/biliboss/my-graph" target="_blank" rel="noreferrer">
            <Button size="lg" className="primary-cta">Ler o código no GitHub <Arrow /></Button>
          </a>
          <a href="#prova">
            <Button size="lg" variant="ghost" className="secondary-cta">Ver com seus olhos <Arrow down /></Button>
          </a>
        </div>
        <div className="hero-proof" aria-label="Legenda do grafo">
          <span>Seta sólida é import.</span>
          <span>Tracejada é comentário.</span>
          <span>Pálido é rascunho.</span>
        </div>
      </header>

      <section className="ticker" aria-label="Resumo">
        <div>DRAWN FROM THE CODE <b>✦</b> EVERY EDGE CITES ITS SOURCE <b>✦</b> A STALE PICTURE IS DETECTABLE <b>✦</b> CONSTRAINTS, NOT ENERGY <b>✦</b> MEASURE THE CURVE, NOT THE CHORD <b>✦</b> DRAWN FROM THE CODE <b>✦</b> EVERY EDGE CITES ITS SOURCE <b>✦</b> A STALE PICTURE IS DETECTABLE <b>✦</b> CONSTRAINTS, NOT ENERGY <b>✦</b> MEASURE THE CURVE, NOT THE CHORD <b>✦</b></div>
      </section>

      <section className="shell section" id="prova">
        <div className="section-kicker">01 / veja com seus olhos</div>
        <div className="split-heading">
          <h2>O grafo não tem<br />modo embelezar.</h2>
          <p>Cinco árvores reais, renderizadas pela mesma ferramenta. Código, rotina, empresa familiar — se dá pra declarar contratos, dá pra mapear. E o desenho entrega a verdade sem pedir licença.</p>
        </div>
        <Carousel />
      </section>

      <section className="shell section problem">
        <div className="section-kicker">02 / o problema real</div>
        <div className="split-heading">
          <h2>O diagrama foi desenhado<br />numa terça-feira.</h2>
          <p>O código não parou de mudar desde então. A figura, sim — e ninguém recebeu o memorando.</p>
        </div>
        <div className="comparison-grid">
          <Card className="compare-card muted-card">
            <CardContent>
              <span className="card-number">ANTES</span>
              <h3>Figura mantida à mão</h3>
              <ul>
                <li>Desenhada uma vez, apodrece em silêncio</li>
                <li>Seta é decoração, não evidência</li>
                <li>Ninguém sabe quando foi gerada</li>
                <li>Erra bonito: parece certa</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="compare-card accent-card">
            <CardContent>
              <span className="card-number">COM MY-GRAPH</span>
              <h3>Figura lida do código</h3>
              <ul>
                <li>Cada aresta cita de onde saiu</li>
                <li>Carimbo de quando foi gerada</li>
                <li>Obsolescência é detectável, não discutível</li>
                <li>Cada verbo de cada interface a um clique</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="layers-section" id="mecanismo">
        <div className="shell section">
          <div className="section-kicker">03 / o mecanismo</div>
          <div className="split-heading">
            <h2>Cinco tintas.<br />Nenhuma é decoração.</h2>
            <p>Um extrator que chamou tudo de "import" errou 22 das 26 arestas da primeira árvore — e a figura parecia certa o tempo todo. Por isso cada traço declara a própria origem.</p>
          </div>
          <div className="layers">
            {inks.map(([symbol, name, what, code]) => (
              <article className="layer" key={name}>
                <span>{symbol}</span><h3>{name}</h3><p>{what}</p><code>{code}</code>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell section evidence" id="evidencia">
        <div className="section-kicker">04 / evidência, sem fantasia</div>
        <div className="split-heading">
          <h2>Garantia tem<br />nome e sobrenome.</h2>
          <p>Não "a IA disse". Número, inequação e carimbo — o tipo de evidência que sobrevive a um ceticismo saudável.</p>
        </div>
        <div className="stats-grid">
          <Card className="stat-card"><CardContent><strong>22/26</strong><span>arestas que um extrator ingênuo errou nesta árvore, chamando tudo de "import"</span></CardContent></Card>
          <Card className="stat-card"><CardContent><strong>0</strong><span>sobreposições permitidas: avoidOverlap é inequação resolvida, não energia baixa</span></CardContent></Card>
          <Card className="stat-card"><CardContent><strong>2d</strong><span>o que custa vencer uma penetração de d numa Bézier quadrática — a curva, não a corda</span></CardContent></Card>
          <Card className="stat-card"><CardContent><strong>11</strong><span>temas no viewer, mais dois toggles que decidem o que a figura mostra</span></CardContent></Card>
        </div>
        <div className="caveat">
          <span>LEIA A LETRA MIÚDA</span>
          <p>A seta tracejada é um comentário — e nada verifica comentário. O grafo não esconde isso: ele diz de onde cada aresta veio pra você decidir quanto confiar olhando, não rezando.</p>
        </div>
      </section>

      <section className="shell section">
        <div className="section-kicker">05 / o desenho</div>
        <div className="split-heading">
          <h2>Constraints,<br />não energia.</h2>
          <p>WebCola resolve separação como inequações VPSC: avoidOverlap é uma promessa sobre caixas. cose e d3-force empurram círculos até a energia baixar — e dois ainda podem terminar um em cima do outro.</p>
        </div>
        <div className="comparison-grid">
          <Card className="compare-card muted-card">
            <CardContent>
              <span className="card-number">FORCE LAYOUT</span>
              <h3>Empurra até parecer bom</h3>
              <ul>
                <li>Energia baixa ≠ zero sobreposição</li>
                <li>Nenhuma garantia sobre caixas</li>
                <li>O desenho depende da semente</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="compare-card accent-card">
            <CardContent>
              <span className="card-number">CONSTRAINT LAYOUT</span>
              <h3>Resolve inequações</h3>
              <ul>
                <li>Separação é restrição, não desejo</li>
                <li>avoidOverlap promete bounding boxes</li>
                <li>Arestas roteadas depois, uma a uma</li>
                <li>Desvio com teto: nada de laçadas</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="urlstate">
          <span className="section-kicker">O ESTADO MORA NA URL</span>
          <code>#open=teams,agents&amp;sel=kanban&amp;d=compact</code>
          <p>Voltar, avançar e reload funcionam de graça. Um link não aponta para o grafo — aponta para uma <strong>leitura</strong> do grafo.</p>
        </div>
      </section>

      <section className="shell section principle">
        <div className="principle-mark">“</div>
        <blockquote>Meça a curva,<br /><em>não a corda.</em></blockquote>
        <p>A reta limpa o que o arco desenhado não limpa — e uma quadrática atinge só metade da distância do ponto de controle no ápice, então vencer uma penetração de d custa 2d. Três versões erradas ensinaram isso; as duas lições estão escritas onde mordem, em ui/GraphCanvas.tsx.</p>
      </section>

      <section className="fit-section" id="familia">
        <div className="shell section fit-grid">
          <div>
            <div className="section-kicker">06 / da mesma família</div>
            <h2>my é o sistema.<br />my-graph é a radiografia.</h2>
            <p className="lead">Mesma casa, mesma disciplina: texto puro como interface, cada saída é superfície de edição, o humano é o portão.</p>
            <a href="https://biliboss.github.io/my/" target="_blank" rel="noreferrer" className="family-link">Conhecer o my <Arrow /></a>
          </div>
          <div className="fit-columns">
            <div className="fit-column yes">
              <span>MY — O SISTEMA</span>
              <p>Sistema operacional pessoal local-first</p>
              <p>Pastas e contratos como arquitetura</p>
              <p>Cada etapa deixa um artefato legível</p>
              <p>biliboss.github.io/my</p>
            </div>
            <div className="fit-column fam">
              <span>MY-GRAPH — A RADIOGRAFIA</span>
              <p>Nasceu dentro do my e virou ferramenta própria</p>
              <p>Lê interface.ts e desenha quem depende de quem</p>
              <p>A primeira árvore desenhada foi a do próprio my</p>
              <p>github.com/biliboss/my-graph</p>
            </div>
          </div>
        </div>
      </section>

      <section className="shell final-cta">
        <span className="section-kicker">A FIGURA CERTA É A LIDA</span>
        <h2>Pare de desenhar arquitetura.<br />Comece a lê-la.</h2>
        <p>Open source, MIT. Aponte para a sua árvore e veja o que ela realmente é — não o que o diagrama de terça-feira dizia.</p>
        <a href="https://github.com/biliboss/my-graph" target="_blank" rel="noreferrer">
          <Button size="lg" className="primary-cta">Apontar para o meu código <Arrow /></Button>
        </a>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top"><span className="brand-mark">g</span><span>my-graph</span></a>
        <p>Draws what depends on what, read straight from the code.</p>
        <div>
          <a href="https://biliboss.github.io/my/" target="_blank" rel="noreferrer">Família my <Arrow /></a>
          <a href="https://github.com/biliboss/my-graph" target="_blank" rel="noreferrer">Código <Arrow /></a>
        </div>
      </footer>
    </main>
  );
}

export default App;
