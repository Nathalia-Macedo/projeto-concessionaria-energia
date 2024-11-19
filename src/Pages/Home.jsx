import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div>
    <h1>Automação de Formulários</h1>
    <Link to="/processar-formulario">Iniciar</Link>
  </div>
);

export default Home;
