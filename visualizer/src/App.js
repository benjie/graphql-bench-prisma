import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ChartistGraph from 'react-chartist';
import 'chartist/dist/chartist.min.css';
import allData from './data.json';
import uniq from 'lodash/uniq';
import groupBy from 'lodash/groupBy';

const QUERIES = Object.keys(allData);

class App extends Component {
  state = {
    query: QUERIES[0],
    stat: 'lat95',
  };

  handleSetQuery = e => {
    this.setState({query: e.target.value});
  };

  render() {
    const entries = allData[this.state.query];
    const rps = uniq(entries.map(e => e.rps)).sort(
      (a, b) => a-b
    );
    const groupedEntries = groupBy(entries, e => e.software);
    const softwares = Object.keys(groupedEntries);
    const data = {
      labels: rps,
      series: softwares.map(
        software => rps.map(
          r => {
            const entry = groupedEntries[software].find(e => e.rps === r)
            if (entry) {
              return entry[this.state.stat];
            } else {
              return null;
            }
          }
        )
      )
    }
    return (
      <div className="App">
        <div style={{width: '100%', height: '10vh'}}>
          Query: <select value={this.state.query} onChange={this.handleSetQuery}>
            {QUERIES.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div style={{width: '100%', height: '90vh'}}>
          <ChartistGraph data={
            data
          } type={'Line'} />
        </div>
      </div>
    );
  }
}

export default App;
