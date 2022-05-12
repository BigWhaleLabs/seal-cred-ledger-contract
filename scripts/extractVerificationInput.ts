import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import FindFiles from 'file-regex'
import { cwd } from 'process'
;(async () => {
  const fileName = await FindFiles(
    path.resolve(cwd(), 'artifacts/build-info'),
    /\/.*?\.json$/g,
    5
  )

  const compiledContract = JSON.parse(
    readFileSync(
      path.resolve(cwd(), `artifacts/build-info/${fileName[0].file}`),
      'utf8'
    )
  )
  writeFileSync(
    path.resolve(cwd(), 'typechain/SCERC721Derivative.json'),
    JSON.stringify(compiledContract.input),
    'utf8'
  )
  console.log('SCERC721Derivative.json file has been saved.')
})()
