# Reach Branch Studio

Versão de desenvolvimento **0.1.0** — uma bancada educacional original da Lofrano Tecnologia para cinemática de braços articulados de 3 juntas rotativas, sob licença MIT. Inspecione a cinemática direta e inversa analítica em forma fechada, explore ramos de cotovelo, avalie alternativas radiais com alcance traseiro, observe rejeições por limites articulares, analise fronteiras de alcance e compare projeções 3D e 2D em tempo real. A aplicação utiliza renderização espacial real com Three.js e alternativa bidimensional em SVG de alto contraste no plano radial-$Z$. Português é a interface padrão; a chave de idioma alterna os textos para inglês.

[English](README.md) · [Contrato](docs/contract.md) · [Design](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br)

## Recursos

- **Cinemática Analítica Exata**: Fórmulas analíticas diretas e inversas puras em forma fechada para um manipulador serial de 3 graus de liberdade (3-DOF RRR) com pedestal de base $H_{\text{base}}$.
- **Enumeração Exaustiva de Ramos**: Gera até 4 candidatos geométricos cobrindo ambas as direções radiais (radial positiva e radial negativa "reach-behind") e ambos os sinais de cotovelo (cotovelo para cima e para baixo).
- **Rejeição Estrita por Limites Articulares**: Validação independente de limites de rotação na base (yaw), ombro e cotovelo com diagnóstico individualizado de juntas violadas.
- **Singularidades e Famílias no Eixo**: Detecção explícita de singularidades no perímetro com cotovelo esticado ($\theta_2 = 0$) e famílias contínuas de 1-DOF com yaw indeterminado no eixo vertical central ($\rho \le \epsilon_{\text{len}}$).
- **Estúdio Interativo 3D / 2D**: Visualização WebGL com elos cilíndricos, marcadores esféricos de juntas, aramado de alcance esférico e projeção planar radial-$Z$ em SVG funcional sem GPU.

## Cinemática Matemática

### Configuração do Braço
- **Origem da Base**: $(0, 0, 0)$.
- **Junta do Ombro**: $(0, 0, H_{\text{base}})$ com $H_{\text{base}} \in [0, 2047]\,\text{mm}$.
- **Junta 0 (Giro da Base $\theta_0$)**: Rotação em torno do eixo $Z$.
- **Junta 1 (Arfagem do Ombro $\theta_1$)**: Rotação no plano radial-$Z$, comprimento $L_1 \in [1, 2047]\,\text{mm}$.
- **Junta 2 (Arfagem do Cotovelo $\theta_2$)**: Rotação relativa ao elo 1, comprimento $L_2 \in [1, 2047]\,\text{mm}$.

### Cinemática Direta (FK)
No referencial radial-$Z$:
$$r_e = L_1 \cos(\theta_1)$$
$$Z_e = H_{\text{base}} + L_1 \sin(\theta_1)$$
$$r_{\text{ee}} = L_1 \cos(\theta_1) + L_2 \cos(\theta_1 + \theta_2)$$
$$Z_{\text{ee}} = H_{\text{base}} + L_1 \sin(\theta_1) + L_2 \sin(\theta_1 + \theta_2)$$

Em coordenadas cartesianas 3D:
$$\mathbf{p}_{\text{ee}} = \begin{pmatrix} r_{\text{ee}} \cos(\theta_0) \\ r_{\text{ee}} \sin(\theta_0) \\ Z_{\text{ee}} \end{pmatrix}$$

### Casos Canônicos de Referência
- Para $L_1 = 100\,\text{mm}, L_2 = 100\,\text{mm}, H_{\text{base}} = 0$:
  - $(\theta_0 = 0^\circ, \theta_1 = 0^\circ, \theta_2 = 90^\circ) \implies (100, 0, 100)\,\text{mm}$.
  - $(\theta_0 = 90^\circ, \theta_1 = 0^\circ, \theta_2 = 90^\circ) \implies (0, 100, 100)\,\text{mm}$.

## Instalação e Uso

Requer Node 22 ou superior (alvo Node 22.23.4 / npm 10.9.9). Dependências diretas são versões exatas fixadas.

```sh
npm ci --ignore-scripts
npm run dev
```

Abra `http://127.0.0.1:5173/reach-branch-studio/`.

### Verificação e Compilação

```sh
npm test
npm run demo -- --assert
npm run demo -- --json
npm run build
npm run preview
```

O preview executa em `http://127.0.0.1:4173/reach-branch-studio/`. A saída de compilação de produção é estática, autocontida e configurada para `/reach-branch-studio/`.

## Qualidade e Determinismo

- Todas as funções cinemáticas centrais são puras e executadas deterministicamente sem chamadas de rede.
- O script de demonstração headless (`src/demo.ts`) valida 8 cenários essenciais incluindo referências canônicas de FK, resíduos de ramos, soluções radiais negativas, rejeições de limites e geração de SVG offline.
