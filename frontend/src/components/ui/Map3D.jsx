import React, { useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';

const SCALE = 10;
const OFFSET = 500;

// Helper to convert 0-1000 2D coordinates to -50 to 50 3D coordinates
const to3D = (coord) => (coord - OFFSET) / SCALE;

const Wall = ({ x1, y1, x2, y2 }) => {
  const p1 = new THREE.Vector3(to3D(x1), 0, to3D(y1));
  const p2 = new THREE.Vector3(to3D(x2), 0, to3D(y2));
  
  const distance = p1.distanceTo(p2);
  const midPoint = p1.clone().add(p2).multiplyScalar(0.5);
  const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

  const height = 4;
  const thickness = 0.5;

  return (
    <mesh position={[midPoint.x, height / 2, midPoint.z]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[distance, height, thickness]} />
      <meshStandardMaterial color="#475569" roughness={0.8} />
    </mesh>
  );
};

export const Map3D = ({ walls = [], path = [], allNodes = [], customStart, customEnd, onNodeClick, onMapClick }) => {
  // Generate points for the route line
  const routePoints = useMemo(() => {
    if (!path || path.length === 0) return [];
    return path.map(node => new THREE.Vector3(to3D(node.x), 0.2, to3D(node.y)));
  }, [path]);

  return (
    <group>
      {/* Floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]} 
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          if (onMapClick) {
            const x = Math.round(e.point.x * SCALE + OFFSET);
            const y = Math.round(e.point.z * SCALE + OFFSET);
            onMapClick({ x, y });
          }
        }}
      >
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* Grid helper for scale reference */}
      <gridHelper args={[120, 120, "#e2e8f0", "#e2e8f0"]} position={[0, 0.01, 0]} />

      {/* Custom Start Pin */}
      {customStart && (
        <mesh position={[to3D(customStart.x), 0.5, to3D(customStart.y)]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
          <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="px-2 py-1 rounded shadow-sm text-xs whitespace-nowrap font-bold bg-blue-100 text-blue-800">
              Current Location
            </div>
          </Html>
        </mesh>
      )}

      {/* Custom End Pin */}
      {customEnd && (
        <mesh position={[to3D(customEnd.x), 0.5, to3D(customEnd.y)]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="px-2 py-1 rounded shadow-sm text-xs whitespace-nowrap font-bold bg-red-100 text-red-800">
              Destination
            </div>
          </Html>
        </mesh>
      )}

      {/* Walls */}
      {walls.map((wall, index) => (
        <Wall key={`wall-${index}`} {...wall} />
      ))}

      {/* Route Path */}
      {routePoints.length > 0 && (
        <Line
          points={routePoints}
          color="#3b82f6"
          lineWidth={5}
          dashed={false}
        />
      )}

      {/* All Nodes (Interactive points) */}
      {allNodes.map(node => (
        <mesh 
          key={node.id} 
          position={[to3D(node.x), 0.5, to3D(node.y)]}
          onPointerDown={(e) => {
            e.stopPropagation();
            console.log('Mesh clicked!', node);
            if (onNodeClick) onNodeClick(node);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial 
            color={node.type === 'entrance' ? '#22c55e' : (node.media_path ? '#a855f7' : '#94a3b8')} 
            emissive={node.media_path ? '#a855f7' : '#000000'}
            emissiveIntensity={0.5}
          />
          <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className={`px-2 py-1 rounded shadow-sm text-xs whitespace-nowrap font-bold ${node.media_path ? 'bg-purple-100 text-purple-800' : 'bg-white text-slate-800'}`}>
              {node.label}
              {node.media_path && <span className="ml-1 material-symbols-outlined text-[10px]">360</span>}
            </div>
          </Html>
        </mesh>
      ))}
      
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 20]} intensity={0.8} castShadow />
      <directionalLight position={[-20, 20, -20]} intensity={0.3} />
    </group>
  );
};
