// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract CertChain {
    mapping(string => bool) public certificates;

    function addCertificate(string memory hash) public {
        certificates[hash] = true;
    }

    function verifyCertificate(string memory hash) public view returns (bool) {
        return certificates[hash];
    }
}