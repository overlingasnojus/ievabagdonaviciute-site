import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { Book, setBookOpen, type BookHandles } from './Book';
import { HitBox, Interactive } from './Interactive';
import { facing, NOTEBOOK } from './layout';
import { surfaces } from './registry';
import { aboutTab, NOTEBOOK_ROSE, notebookCover, notebookPage, notebookSpine } from './textures';

// About: the notebook slides out of its cabinet compartment, floats up to a reading
// position, turns to the camera and opens.

const OUT = new THREE.Vector3(1, 0, 0); // the cabinet opens toward +x
const slid = NOTEBOOK.rest.clone().addScaledVector(OUT, NOTEBOOK.slide);
const ctrl = slid.clone().addScaledVector(OUT, 0.45).add(new THREE.Vector3(0, 0.75, 0.1));
const readQuat = facing(NOTEBOOK.readDir);
const pos = new THREE.Vector3();
const start = new THREE.Vector3();

export function quadBezier(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  return out.set(0, 0, 0).addScaledVector(a, u * u).addScaledVector(b, 2 * u * t).addScaledVector(c, t * t);
}

export function Notebook() {
  const book = useRef<BookHandles>(null);

  useEffect(() => {
    if (book.current)
      surfaces.about = {
        object: book.current.surface,
        size: [NOTEBOOK.w * 2 - 0.02, NOTEBOOK.h],
        // open, at the reading pose: the spread's resting place once the book settles
        final: new THREE.Matrix4()
          .compose(NOTEBOOK.read, readQuat, new THREE.Vector3(1, 1, 1))
          .multiply(new THREE.Matrix4().makeTranslation(book.current.surface.position)),
      };
    return () => void delete surfaces.about;
  }, []);

  useFrame(() => {
    const b = book.current;
    if (!b) return;
    const a = anim.about;
    const peek = anim.hover.about * 0.07;

    start.copy(NOTEBOOK.rest).addScaledVector(OUT, a.slide * NOTEBOOK.slide + peek);
    if (a.float > 0) quadBezier(start, ctrl, NOTEBOOK.read, a.float, pos);
    else pos.copy(start);
    // pages settle with a small dip once the cover lands
    pos.y -= Math.sin(a.settle * Math.PI) * 0.012;
    b.root.position.copy(pos);
    b.root.quaternion.copy(NOTEBOOK.restQuat).slerp(readQuat, a.float);

    setBookOpen(b, a.cover);
    // the top page lifts with the cover, then settles
    const lift = Math.sin(a.cover * Math.PI) * 0.32;
    const wiggle = Math.sin(a.settle * Math.PI * 2.5) * (1 - a.settle) * 0.07;
    b.leaf.rotation.y = -(lift * (1 - a.settle) + wiggle);
  });

  return (
    <Interactive id="about">
      <Book
        ref={book}
        w={NOTEBOOK.w}
        h={NOTEBOOK.h}
        t={NOTEBOOK.t}
        coverColor={NOTEBOOK_ROSE}
        coverMap={notebookCover()}
        spineMap={notebookSpine()}
        pageMap={notebookPage()}
        overhang={0.02}
        stitches
        tab={aboutTab()}
      />
      <HitBox size={[0.6, 1.0, 0.5]} position={[NOTEBOOK.rest.x - 0.1, NOTEBOOK.rest.y, NOTEBOOK.rest.z]} />
    </Interactive>
  );
}
