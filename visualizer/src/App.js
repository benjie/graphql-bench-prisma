import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ChartistGraph from 'react-chartist';
import 'chartist/dist/chartist.min.css';

class App extends Component {
  render() {
    const data = {
      labels: 'MTWTFSS'.split(''),
      series: [
        [12, 9 ,7 ,8 ,5],
        [2, 1, 3.5, 7, 3],
        [1, 3, 4, 5, 6]
      ]
    };
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <ChartistGraph data={
          data
        } type={'Line'} />
      </div>
    );
  }
}

export default App;
