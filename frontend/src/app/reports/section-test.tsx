'use client';

export default function SectionTest() {
  const selectedFarm = null;
  
  return (
    <div className="space-y-6">
      {!selectedFarm ? (
        <>
          <div>
            <h2>All Farms Financial Summary</h2>
          </div>
        </>
      ) : (
        <>
          <div>
            <h2>Farm Information</h2>
          </div>
        </>
      )}
    </div>
  );
}