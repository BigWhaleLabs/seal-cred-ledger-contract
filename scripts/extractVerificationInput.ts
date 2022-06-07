import { readFileSync, writeFileSync, appendFileSync } from 'fs'
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
    path.resolve(cwd(), 'typechain/SCERC721DerivativeConfig.ts'),
    `export const SCERC721DerivativeConfig = ${JSON.stringify(
      compiledContract.input
    )}`,
    'utf8'
  )
  appendFileSync(
    path.resolve(cwd(), 'typechain/index.ts'),
    `export { SCERC721DerivativeConfig } from './SCERC721DerivativeConfig'`,
    'utf8'
  )
  console.log('SCERC721Derivative.json file has been saved.')
})()
