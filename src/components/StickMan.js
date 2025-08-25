import React from 'react';

// StickMan class for creating scalable stick man instances
class StickMan {
  constructor(x, y, scale = 1, name = '') {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.name = name;
  }

  // Render the stick man as SVG elements
  render() {
    const s = this.scale; // Scale factor
    const x = this.x;
    const y = this.y;
    
    return (
      <g key={`${x}-${y}-${this.name}`}>
        {/* Head */}
        <circle 
          cx={x} 
          cy={y - 35 * s} 
          r={5 * s} 
          fill="none" 
          stroke="black" 
          strokeWidth={2 * s} 
        />
        
        {/* Body */}
        <line 
          x1={x} 
          y1={y - 30 * s} 
          x2={x} 
          y2={y - 10 * s} 
          stroke="black" 
          strokeWidth={2 * s} 
        />
        
        {/* Arms */}
        <line 
          x1={x - 8 * s} 
          y1={y - 25 * s} 
          x2={x + 8 * s} 
          y2={y - 25 * s} 
          stroke="black" 
          strokeWidth={2 * s} 
        />
        
        {/* Left leg */}
        <line 
          x1={x - 3 * s} 
          y1={y - 8 * s} 
          x2={x - 6 * s} 
          y2={y} 
          stroke="black" 
          strokeWidth={2 * s} 
        />
        
        {/* Right leg */}
        <line 
          x1={x + 3 * s} 
          y1={y - 8 * s} 
          x2={x + 6 * s} 
          y2={y} 
          stroke="black" 
          strokeWidth={2 * s} 
        />
        
        {/* Name under stick man */}
        <text 
          x={x} 
          y={y + 15 * s} 
          textAnchor="middle" 
          fontSize={12 * s} 
          fill="black" 
          className="font-medium"
        >
          {this.name}
        </text>
      </g>
    );
  }
}

export default StickMan;
