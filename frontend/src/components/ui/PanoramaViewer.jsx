import React, { useEffect, useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const MEDIA_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const PanoramaViewer = ({ mediaPath, mediaType }) => {
  if (mediaType === 'video') {
    return <VideoPanorama mediaPath={mediaPath} />;
  }
  return <ImagePanorama mediaPath={mediaPath} />;
};

const ImagePanorama = ({ mediaPath }) => {
  const texture = useTexture(`${MEDIA_BASE_URL}${mediaPath}`);
  
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
};

const VideoPanorama = ({ mediaPath }) => {
  const [video] = useState(() => {
    const vid = document.createElement('video');
    vid.src = `${MEDIA_BASE_URL}${mediaPath}`;
    vid.crossOrigin = 'Anonymous';
    vid.loop = true;
    vid.muted = true;
    vid.play();
    return vid;
  });

  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial side={THREE.BackSide}>
        <videoTexture attach="map" args={[video]} colorSpace={THREE.SRGBColorSpace} />
      </meshBasicMaterial>
    </mesh>
  );
};
