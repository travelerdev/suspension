import React, { PropsWithChildren, Suspense, SuspenseProps, useEffect, useState } from "react";
import { makeRigCacheViewer, RigCacheViewer, SuspensionCache } from "./SuspensionCache";
import SuspensionRigContext from "./SuspensionRigContext";

/**
 * The SuspensionRig provides a context for suspension hooks to cache data about their
 * calls upon. It can also act as your Suspense barrier if you provide the fallback prop.
 */
export default function SuspensionRig({
  children,
  fallback
}: PropsWithChildren<Partial<Pick<SuspenseProps, "fallback">>>) {
  const [rigViewer, setRigViewer] = useState<RigCacheViewer | Promise<RigCacheViewer>>(null as any);

  // If we're instantiated but not yet mounted, make a promise for when we are ready.
  let promiseResolver: null | ((viewer: RigCacheViewer) => void) = null;
  if (!rigViewer) {
    const whenReady = new Promise<RigCacheViewer>((resolver) => {
      promiseResolver = resolver;
    });
    setRigViewer(whenReady);
  }
  const [rigPromiseResolver, setRigPromiseResolver] = useState<
    ((viewer: RigCacheViewer) => void) | null
  >(promiseResolver);

  useEffect(() => {
    const myRigId = SuspensionCache.shared().connect();
    const newViewer = makeRigCacheViewer(myRigId);
    setRigViewer(newViewer);

    if (rigPromiseResolver) {
      rigPromiseResolver(newViewer);
      setRigPromiseResolver(null);
    }

    return () => {
      // TODO: Maybe this should be optional?
      SuspensionCache.shared().destroy(myRigId);
    };
  }, []);

  return (
    <SuspensionRigContext.Provider value={rigViewer}>
      {fallback ? <Suspense fallback={fallback}>{children}</Suspense> : children}
    </SuspensionRigContext.Provider>
  );
}
