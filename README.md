# Teste de performance com K6

Este repositório foi adaptado para o trabalho de conclusão da disciplina Teste de Performance do curso de Pós-Graduação em Automação de Testes de Software.
Nele foi implementado um teste em que registra um usuário, faz login dele e também checkout, utilizando vários vários conceitos adquiridos e praticados nas aulas da disciplina.

Esses conceitos estão detalhados na sequência.

## Conceitos aplicados

### Thresholds

Refere-se a seção onde define critérios de aceitação do teste de performance. 

Neste trecho do arquivo (test\k6) foi definido que, globalmente, 95% de todas as requisições do teste devem responder em até 2 segundos.

```js
export const options = {
  thresholds: {
    http_req_duration: ['p(95) < 2000'],

    register_duration: ['p(95) < 2000'],
    login_duration: ['p(95) < 2000'],
    checkout_duration: ['p(95) < 2000']
  }}
```
### Checks

São validações funcionais executadas a cada requisição HTTP do helper (arquivo test\k6\helpers\auth.js). 

No trecho abaixo, verifica se o cadastro do usuário retornou 201.

```js
const response = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
    });

  check(response, {
    'register: status code is 201': (r) => r.status === 201
  });
```
### Helpers

Os helpers concentram chamadas reutilizáveis (ex.: login), variável de ambiente e função utilitária (geração de e-mail), funcionando como uma camada de abstração de requisições, o que promovendo reutilização de código e melhor organização dos testes.

O trecho abaixo é o conteúdo do helper de geração aleatória de e-mail.

```js
/**
 * Gera um email aleatório único
 * @returns {string}
 */
export function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `user_${timestamp}_${random}@test.com`;
}
```

### Trends

Um Trend é uma métrica que armazena valores numéricos ao longo do tempo, permitindo cálculos como de média e percentis.

No código abaixo, a cada execução do login, o tempo de resposta é coletado e armazenado ao longo do teste.

```js
loginTrend.add(response.timings.duration);
```

No arquivo test\k6\checkout.test.js, o threshold do loginTrend define que 95% das requisições de login devem responder em até 2 segundos.

```js
login_duration: ['p(95) < 2000'],
```
### Faker

Faker é uma biblioteca utilizada para gerar dados fictícios (fake) de forma automática.

No trecho, é usado no arquivo helper email.js, para gerar um e-mail aleatório fake.

```js
import { faker } from '@faker-js/faker';
/**
 * Gera um email aleatório
 * @returns {string}
 */
export function generateRandomEmail() {
  return faker.internet.email().toLowerCase();
}
```
### Variável de Ambiente

Variáveis de ambiente são valores de configuração externos ao código principal, definidos no processo de execução.

A função getBaseURL() lê a variável de ambiente BASE_URL (__ENV.BASE_URL).No trecho abaixo, o código utiliza um valor padrão (http://localhost:3000).

```js
/**
 * Obter a URL base da API
 * @returns {string} URL base da API
 */
export function getBaseURL() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}
```

### Stages

Stages são usados para aplicar variação progressiva de carga ao longo do tempo, passando por diversos estágios como ramp-up, average, spike e ramp-down.

No trecho abaixo, é possível identificar as etapas, além de uma etapa inicial de 'aquecimento'.

```js
export const options = {
  stages: [
    { duration: '3s', target: 5 }, //Ramp up
    { duration: '15s', target: 10 }, //Average
    { duration: '2s', target: 50 }, //Spike
    { duration: '5s', target: 10 }, //Ramp down pós-spike
    { duration: '5s', target: 0 } //Ramp down final
  ],
}
```
### Reaproveitamento de Resposta

Ocorre quando dados retornados por uma requisição são armazenados e reutilizados em chamadas seguintes, evitando novas consultas desnecessárias e mantendo a continuidade do fluxo de negócio no teste.

O reaproveitamento acontece no fluxo de Checkout, quando a resposta do login é usada novamente - o token retornado pela função `login` é capturado na variável `token` e reutilizado como parâmetro na chamada do `checkout`, permitindo que a requisição de checkout seja autenticada com base na resposta anterior.

```js
group('Checkout Process', () => {
    const token = login(email, password);
    const items = [{ productId: 1, quantity: 1 }];
    const freight = 20;
    const paymentMethod = 'boleto';
    checkout(token, items, freight, paymentMethod);
  });
```
### Uso de Token de Autenticação

O token de autenticação JWT é utilizado para identificar e autorizar o usuário após o login. Ele é gerado quando o usuário se autentica com sucesso e deve ser enviado nas requisições seguintes para endpoints protegidos, normalmente no header Authorization, evitando a necessidade de reenviar usuário e senha a cada chamada.

Geração do token no método `login`, onde após a requisição de autenticação, o token é extraído da resposta:

```js
const body = response.json();
return body?.token || null;
```
Uso do token em requisição protegida, no método checkout, onde o token recebido no login é enviado no header `Authorization`:

```js
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```
### Groups

É um recurso do k6 usado para organizar o teste de performance em etapas lógicas do fluxo do usuário, permitindo separar e analisar métricas, tempos de resposta e checks de cada fase.

Neste trecho, o `group` é utilizado para representar claramente o fluxo funcional do usuário, encapsulando chamadas de `register`, `login` e `checkout`.

```js
group('User Registration', () => {
    register(name, email, password);
  });

  group('User Login', () => {
    login(email, password);
  });

  group('Checkout Process', () => {
    const token = login(email, password);
    const items = [{ productId: 1, quantity: 1 }];
    const freight = 20;
    const paymentMethod = 'boleto';
    checkout(token, items, freight, paymentMethod);
  });
```
### Data-Driven Testing

É a abordagem em que o mesmo fluxo de teste é executado várias vezes utilizando dados externos, permitindo validar diferentes cenários sem alterar o código do teste. Cada VU ou iteração consome um conjunto de dados distinto, aumentando a cobertura e a reutilização do script.

1. Carregamento dos dados externos:
```js
const loginData = new SharedArray('login data', function () {
  return JSON.parse(open('./data/login.test.data.json'));
});
```
2. Seleção do conjunto de dados por VU:
```js
const data = loginData[__VU - 1];
```
3. Uso dos dados no fluxo testado:
```js
login(data.email, data.password);
```

## Pré-requisitos

- Node.js instalado (versão 18 ou superior)

- k6 instalado e disponível no PATH

- API Backend em execução

- Porta padrão da aplicação: 3000 (ou outra definida via variável de ambiente)

## Estrutura do projeto

```text
test/
 └─ k6/
    ├─ checkout.test.js        # Teste de performance do fluxo completo
    ├─ login.test.js           # Teste de login com Data-Driven Testing
    ├─ helpers/
    │   ├─ auth.js             # Funções reutilizáveis de autenticação e checkout
    │   ├─ email.js            # Geração de e-mails dinâmicos (faker)
    └─ data/
        └─ login.test.data.json # Massa de dados para testes DDT

```

## Como rodar

### k6

Checkout
```bash
k6 run test/k6/checkout.test.js
```
Login com DDT
```bash
k6 run test/k6/login.test.js
```

## Endpoints REST
- POST `/api/users/register` — Registro de usuário
- POST `/api/users/login` — Login (retorna token JWT)
- POST `/api/checkout` — Checkout (requer token JWT)

## Regras de Checkout
- Só pode fazer checkout com token JWT válido
- Informe lista de produtos, quantidades, valor do frete, método de pagamento e dados do cartão se necessário
- 5% de desconto no valor total se pagar com cartão
- Resposta do checkout contém valor final

## Documentação
- Swagger disponível em `/api-docs`

## Instalações

### Faker
```bash
npm install @faker-js/faker --save-dev
```

