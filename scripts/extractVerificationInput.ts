import fs from 'fs'
import path from 'path'
import FindFiles from 'file-regex'

void (async () => {
  const fileName = await FindFiles(
    path.join(__dirname, '../artifacts/build-info'),
    /\/.*?\.json$/g,
    5
  )
  const compiledContract = await import(
    `../artifacts/build-info/${fileName[0].file}`
  )

  fs.writeFile(
    path.join(__dirname, '../typechain/SCERC721Derivative.json'),
    JSON.stringify(compiledContract.input),
    'utf8',
    function (err) {
      if (err) {
        console.log('An error occured while writing JSON Object to File.')
        return console.log(err)
      }

      console.log('SCERC721Derivative.json file has been saved.')
    }
  )
})()
