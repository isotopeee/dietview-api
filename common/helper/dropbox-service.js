'use strict';

const fs = require('fs');
const Dropbox = require('dropbox');
const dbConfig = require('../../server/config.json').dropbox;

let dbx = new Dropbox({ accessToken: dbConfig.accessToken });

module.exports = {
    uploadFile: uploadFile,
    listFiles: listFiles
};

/**
 * @param
 *  file: The file that will be uploaded.
 *  filename: The filename of the file that will be uploaded.
 *  callback: Returns the URL of the uploaded file
 */

function uploadFile(file, filename, callback){
    fs.readFile(file, (err, contents) => {
        if (err) throw err;
        //begin dropbox upload
        dbx.filesUpload({ path: dbConfig.root + filename, contents: contents })
            .then((fileUploadResponse) => {
                //get the uploaded URL
                getSharedLink(fileUploadResponse)
                    .then((createSharedLinkResponse) => {
                        callback(createSharedLinkResponse);
                    });
            });
    });
}

function getSharedLink(fileUploadResponse){
   return dbx.sharingCreateSharedLink({ path: fileUploadResponse.path_lower })
        .then((createSharedLinkResponse) => {
            createSharedLinkResponse.rawURL = createSharedLinkResponse.url + '&raw=1';
            return createSharedLinkResponse;
        })
        .catch((err) => {
            throw err;
        });
}

function listFiles(){
    return dbx.filesListFolder({ path: dbConfig.root })
        .then((files) => {
            return files;
        })
        .catch((err) => {
            throw err;
        });
}

