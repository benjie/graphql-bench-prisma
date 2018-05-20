import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ChartistGraph from 'react-chartist';
import 'chartist/dist/chartist.min.css';
import allData from './data.json';
import uniq from 'lodash/uniq';
import groupBy from 'lodash/groupBy';
import Chartist from 'chartist';

const QUERIES = Object.keys(allData);

const makeOptions = o => {
  return {
    ...o,
    options: {
      ...o.options,
      axisX: {
        type: Chartist.FixedScaleAxis,
        onlyInteger: true,
        ...o.axisX
      },
    }
  };
}
const CONFIG_BY_STAT = {
  "latMean": makeOptions({}),
  "lat50": makeOptions({}),
  "lat95": makeOptions({}),
  "lat99": makeOptions({}),
  "latMax": makeOptions({}),
  "success": makeOptions({}),
  "failure": makeOptions({}),
};

const ALL_STATS = Object.keys(CONFIG_BY_STAT);

class App extends Component {
  state = {
    query: QUERIES[0],
    stat: 'lat95',
  };

  handleSetQuery = e => {
    this.setState({query: e.target.value});
  };
  handleSetStat = e => {
    this.setState({stat: e.target.value});
  };

  render() {
    const entries = allData[this.state.query];
    const rps = uniq(entries.map(e => e.rps)).sort(
      (a, b) => a-b
    );
    const groupedEntries = groupBy(entries, e => e.software);
    const softwares = Object.keys(groupedEntries);
    const data = {
      labels: rps.map((r, i) => i % 2 === 1 ? r : ''),
      series: softwares.map(
        software => ({
          name: software,
          className: `series-${software.replace(/[^a-z0-9]/g, '-')}`,
          data: rps.map(
            r => {
              const entry = groupedEntries[software].find(e => e.rps === r)
              if (entry) {
                return {x: r, y: entry[this.state.stat]};
              } else {
                return {x: r, y: null};
              }
            }
          ).filter(p => p.y !== null)
        })
      )
    }
    const {options: baseOptions, title} = CONFIG_BY_STAT[this.state.stat] || {};
    const options = {
      ...baseOptions,
      axisX: {
        ...baseOptions.axisX,
        ticks:  rps.filter((r, i) => i % 2 === 1),
        low: 0,
        high: rps[rps.length - 1],
      }
    };
        console.log(  rps.filter((r, i) => i % 2 === 1))
    return (
      <div className="App">
        <div style={{width: '100%', height: '10vh'}}>
          Query: <select value={this.state.query} onChange={this.handleSetQuery}>
            {QUERIES.map(q => <option key={q} value={q}>{q}</option>)}
          </select>{ ' ' }
          Stat: <select value={this.state.stat} onChange={this.handleSetStat}>
            {ALL_STATS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div style={{display: 'flex', height: '90vh', alignItems: 'stretch'}}>
          <div style={{flex: '1 0 0'}}>
            <ChartistGraph options={options} data={
              data
            } type={'Line'} />
          </div>
          <div style={{flex: '0 0 100px'}}>
            <h3>Legend</h3>
            <div className='label-postgraphile'>
              postgraphile
            </div>
            <div className='label-postgraphile-next'>
              postgraphile-next
            </div>
            <div className='label-prisma'>
              prisma
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
