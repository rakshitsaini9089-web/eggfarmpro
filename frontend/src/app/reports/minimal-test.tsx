'use client';

export default function MinimalTest() {
  return (
    <div className="space-y-6">
      {!true ? (
        <>
          <div>
            <h2>Test</h2>
          </div>
        </>
      ) : (
        <>
          <div>
            <h2>Test</h2>
          </div>
        </>
      )}
    </div>
  );
}