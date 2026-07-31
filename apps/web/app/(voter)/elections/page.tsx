// // 'use client'

// // import { useReadContract } from 'wagmi'
// // import { electionFactoryAbi, electionAbi } from '../../../../../packages/contracts/abi'
// // import Link from 'next/link'

// // export default function ElectionsPage() {
// //   const {
// //     data: elections,
// //     isLoading,
// //     error,
// //   } = useReadContract({
// //     address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
// //     abi: electionFactoryAbi,
// //     functionName: 'getElections',
// //     chainId: 80002,
// //   })

// //   if (isLoading) {
// //     return <p>Loading elections...</p>
// //   }

// //   if (error) {
// //     return (
// //       <div>
// //         <h1>Elections</h1>
// //         <p>Error loading elections</p>
// //       </div>
// //     )
// //   }

// //   return (
// //     <main>
// //       <h1>Elections</h1>

// //       {!elections || elections.length === 0 ? (
// //         <p>No elections found</p>
// //       ) : (
// //         elections.map((address) => (
// //           <ElectionCard
// //             key={address}
// //             address={address}
// //           />
// //         ))
// //       )}
// //     </main>
// //   )
// // }


// // function ElectionCard({
// //   address,
// // }: {
// //   address: `0x${string}`
// // }) {

// //   const {
// //     data: name,
// //     isLoading: nameLoading,
// //   } = useReadContract({
// //     address,
// //     abi: electionAbi,
// //     functionName: 'name',
// //     chainId: 80002,
// //   })


// //   const {
// //     data: isVotingOpen,
// //     isLoading: statusLoading,
// //   } = useReadContract({
// //     address,
// //     abi: electionAbi,
// //     functionName: 'isVotingOpen',
// //     chainId: 80002,
// //   })


// //   const {
// //     data: startTime,
// //   } = useReadContract({
// //     address,
// //     abi: electionAbi,
// //     functionName: 'startTime',
// //     chainId: 80002,
// //   })


// //   const {
// //     data: endTime,
// //   } = useReadContract({
// //     address,
// //     abi: electionAbi,
// //     functionName: 'endTime',
// //     chainId: 80002,
// //   })


// //   let status = 'Loading...'

// //   if (!statusLoading && startTime && endTime) {
// //     const now = Math.floor(Date.now() / 1000)

// //     if (now < Number(startTime)) {
// //       status = 'Upcoming'
// //     } else if (now > Number(endTime)) {
// //       status = 'Closed'
// //     } else {
// //       status = 'Open'
// //     }
// //   }


// //   return (
// //     <div
// //       style={{
// //         border: '1px solid #ccc',
// //         padding: '16px',
// //         marginTop: '12px',
// //         borderRadius: '8px',
// //       }}
// //     >

// //       <h2>
// //         {nameLoading ? 'Loading...' : name}
// //       </h2>


// //       <p>
// //         Status: {status}
// //       </p>


// //       <p>
// //         Start Time:
// //         <br />
// //         {startTime
// //           ? new Date(Number(startTime) * 1000).toLocaleString()
// //           : 'Loading...'
// //         }
// //       </p>


// //       <p>
// //         End Time:
// //         <br />
// //         {endTime
// //           ? new Date(Number(endTime) * 1000).toLocaleString()
// //           : 'Loading...'
// //         }
// //       </p>


// //       <p>
// //         Contract Address:
// //         <br />
// //         {address}
// //       </p>


// //       <Link
// //         href={`/elections/${address}`}
// //         style={{
// //           display: 'inline-block',
// //           marginTop: '16px',
// //           padding: '10px 20px',
// //           borderRadius: '8px',
// //           backgroundColor: '#2563eb',
// //           color: 'white',
// //           textDecoration: 'none',
// //           fontWeight: '600',
// //           cursor: 'pointer',
// //         }}
// //       >
// //         View Election
// //       </Link>

// //     </div>
// //   )
// // }




// 'use client'

// import Link from 'next/link'
// import { useReadContract } from 'wagmi'
// import { electionFactoryAbi, electionAbi } from '../../../../../packages/contracts/abi'

// export default function ElectionsPage() {
//   const {
//     data: elections,
//     isLoading,
//     error,
//     refetch,
//   } = useReadContract({
//     address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
//     abi: electionFactoryAbi,
//     functionName: 'getElections',
//     chainId: 80002,
//   })


//   if (isLoading) {
//     return (
//       <main>
//         <h1>Elections</h1>

//         <ElectionSkeleton />
//         <ElectionSkeleton />
//         <ElectionSkeleton />
//       </main>
//     )
//   }


//   if (error) {
//     return (
//       <main>
//         <h1>Elections</h1>

//         <p>
//           Unable to load elections. Please try again.
//         </p>

//         <button
//           onClick={() => refetch()}
//           style={{
//             marginTop: '12px',
//             padding: '10px 18px',
//             borderRadius: '8px',
//             border: 'none',
//             cursor: 'pointer',
//             background: '#2563eb',
//             color: 'white',
//           }}
//         >
//           Retry
//         </button>
//       </main>
//     )
//   }


//   return (
//     <main>
//       <h1>Elections</h1>


//       {!elections || elections.length === 0 ? (
//         <p>No elections yet</p>
//       ) : (
//         elections.map((address) => (
//           <ElectionCard
//             key={address}
//             address={address}
//           />
//         ))
//       )}
//     </main>
//   )
// }



// function ElectionCard({
//   address,
// }: {
//   address: `0x${string}`
// }) {

//   const {
//     data: name,
//   } = useReadContract({
//     address,
//     abi: electionAbi,
//     functionName: 'name',
//     chainId: 80002,
//   })


//   const {
//     data: startTime,
//   } = useReadContract({
//     address,
//     abi: electionAbi,
//     functionName: 'startTime',
//     chainId: 80002,
//   })


//   const {
//     data: endTime,
//   } = useReadContract({
//     address,
//     abi: electionAbi,
//     functionName: 'endTime',
//     chainId: 80002,
//   })


//   let status = 'Loading...'


//   if (startTime && endTime) {
//     const now = Math.floor(Date.now() / 1000)

//     const start = Number(startTime)
//     const end = Number(endTime)


//     if (now < start) {
//       status = 'Upcoming'
//     } else if (now >= start && now <= end) {
//       status = 'Open'
//     } else {
//       status = 'Closed'
//     }
//   }


//   return (
//     <Link
//       href={`/elections/${address}`}
//       aria-label={`${name ?? 'Election'} - ${status}`}
//       style={{
//         display: 'block',
//         textDecoration: 'none',
//         color: 'inherit',
//         border: '1px solid #ccc',
//         padding: '16px',
//         marginTop: '12px',
//         borderRadius: '10px',
//         cursor: 'pointer',
//       }}
//     >

//       <h2>
//         {name ?? 'Loading...'}
//       </h2>


//       <p>
//         Status: {status}
//       </p>


//       <p>
//         Start Time:
//         <br />
//         {
//           startTime
//             ? `${new Date(Number(startTime) * 1000).toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
//             : 'Loading...'
//         }
//       </p>


//       <p>
//         End Time:
//         <br />
//         {
//           endTime
//             ? `${new Date(Number(endTime) * 1000).toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
//             : 'Loading...'
//         }
//       </p>


//       <p>
//         Contract Address:
//         <br />
//         {address}
//       </p>

//     </Link>
//   )
// }



// function ElectionSkeleton() {
//   return (
//     <div
//       style={{
//         border: '1px solid #ddd',
//         padding: '16px',
//         marginTop: '12px',
//         borderRadius: '10px',
//       }}
//       aria-hidden="true"
//     >
//       <div
//         style={{
//           height: '20px',
//           width: '60%',
//           background: '#eee',
//           marginBottom: '12px',
//           borderRadius: '4px',
//         }}
//       />

//       <div
//         style={{
//           height: '16px',
//           width: '40%',
//           background: '#eee',
//           marginBottom: '12px',
//           borderRadius: '4px',
//         }}
//       />

//       <div
//         style={{
//           height: '16px',
//           width: '80%',
//           background: '#eee',
//           borderRadius: '4px',
//         }}
//       />
//     </div>
//   )
// }



'use client'

import Link from 'next/link'
import { useReadContract } from 'wagmi'
import { electionFactoryAbi, electionAbi } from '../../../../../packages/contracts/abi'

export default function ElectionsPage() {
  const {
    data: elections,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: electionFactoryAbi,
    functionName: 'getElections',
    chainId: 80002,
  })

  // ✅ LOADING STATE (Skeletons)
  if (isLoading) {
    return (
      <main>
        <h1>Elections</h1>

        <ElectionSkeleton />
        <ElectionSkeleton />
        <ElectionSkeleton />
      </main>
    )
  }

  // ✅ ERROR STATE (with Retry button)
  if (error) {
    return (
      <main>
        <h1>Elections</h1>

        <p>Unable to load elections. Please try again.</p>

        <button
          onClick={() => refetch()}
          style={{
            marginTop: '12px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: '#2563eb',
            color: 'white',
          }}
        >
          Retry
        </button>
      </main>
    )
  }

  // ✅ MAIN UI
  return (
    <main>
      <h1>Elections</h1>

      {/* ✅ EMPTY STATE */}
      {!elections || elections.length === 0 ? (
        <p>No elections yet</p>
      ) : (
        elections.map((address) => (
          <ElectionCard key={address} address={address} />
        ))
      )}
    </main>
  )
}

// ✅ ELECTION CARD
function ElectionCard({
  address,
}: {
  address: `0x${string}`
}) {
  const { data: name } = useReadContract({
    address,
    abi: electionAbi,
    functionName: 'name',
    chainId: 80002,
  })

  const { data: startTime } = useReadContract({
    address,
    abi: electionAbi,
    functionName: 'startTime',
    chainId: 80002,
  })

  const { data: endTime } = useReadContract({
    address,
    abi: electionAbi,
    functionName: 'endTime',
    chainId: 80002,
  })

  let status = 'Loading...'

  if (startTime && endTime) {
    const now = Math.floor(Date.now() / 1000)

    const start = Number(startTime)
    const end = Number(endTime)

    if (now < start) {
      status = 'Upcoming'
    } else if (now >= start && now <= end) {
      status = 'Open'
    } else {
      status = 'Closed'
    }
  }

  return (
    <Link
      href={`/elections/${address}`}
      aria-label={`${name ?? 'Election'} - ${status}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid #ccc',
        padding: '16px',
        marginTop: '12px',
        borderRadius: '10px',
        cursor: 'pointer',
      }}
    >
      <h2>{name ?? 'Loading...'}</h2>

      <p>Status: {status}</p>

      <p>
        Start Time:
        <br />
        {startTime
          ? `${new Date(Number(startTime) * 1000).toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
          : 'Loading...'}
      </p>

      <p>
        End Time:
        <br />
        {endTime
          ? `${new Date(Number(endTime) * 1000).toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
          : 'Loading...'}
      </p>

      <p>
        Contract Address:
        <br />
        {address}
      </p>
    </Link>
  )
}

// ✅ SKELETON COMPONENT
function ElectionSkeleton() {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '16px',
        marginTop: '12px',
        borderRadius: '10px',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          height: '20px',
          width: '60%',
          background: '#eee',
          marginBottom: '12px',
          borderRadius: '4px',
        }}
      />

      <div
        style={{
          height: '16px',
          width: '40%',
          background: '#eee',
          marginBottom: '12px',
          borderRadius: '4px',
        }}
      />

      <div
        style={{
          height: '16px',
          width: '80%',
          background: '#eee',
          borderRadius: '4px',
        }}
      />
    </div>
  )
}