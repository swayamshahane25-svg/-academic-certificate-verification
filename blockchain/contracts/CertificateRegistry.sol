// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract CertificateRegistry {

    struct Certificate {
        string certificateId;
        string studentName;
        string degree;
        string department;
        string university;
        string certificateHash;
        string issuer;
        uint256 issueDate;
        bool revoked;
    }

    mapping(string => Certificate) private certificates;

    string[] private certificateIds;

    event CertificateIssued(
        string certificateId,
        string studentName,
        string degree,
        string department,
        string university,
        string certificateHash,
        string issuer,
        uint256 issueDate
    );

    event CertificateRevoked(
        string certificateId
    );

    function issueCertificate(
        string memory _certificateId,
        string memory _studentName,
        string memory _degree,
        string memory _department,
        string memory _university,
        string memory _certificateHash,
        string memory _issuer
    ) public {

        require(
            bytes(certificates[_certificateId].certificateId).length == 0,
            "Certificate already exists"
        );

        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            studentName: _studentName,
            degree: _degree,
            department: _department,
            university: _university,
            certificateHash: _certificateHash,
            issuer: _issuer,
            issueDate: block.timestamp,
            revoked: false
        });

        certificateIds.push(_certificateId);

        emit CertificateIssued(
            _certificateId,
            _studentName,
            _degree,
            _department,
            _university,
            _certificateHash,
            _issuer,
            block.timestamp
        );
    }

    function verifyCertificate(
        string memory _certificateId,
        string memory _certificateHash
    )
        public
        view
        returns (
            bool valid,
            string memory studentName,
            string memory degree,
            string memory department,
            string memory university,
            string memory issuer,
            uint256 issueDate,
            bool revoked
        )
    {
        Certificate memory certificate =
            certificates[_certificateId];

        if (
            bytes(certificate.certificateId).length == 0
        ) {
            return (
                false,
                "",
                "",
                "",
                "",
                "",
                0,
                false
            );
        }

        bool hashMatches =
            keccak256(
                bytes(certificate.certificateHash)
            )
            ==
            keccak256(
                bytes(_certificateHash)
            );

        return (
            hashMatches,
            certificate.studentName,
            certificate.degree,
            certificate.department,
            certificate.university,
            certificate.issuer,
            certificate.issueDate,
            certificate.revoked
        );
    }

    function revokeCertificate(
        string memory _certificateId
    ) public {

        require(
            bytes(
                certificates[_certificateId].certificateId
            ).length != 0,
            "Certificate does not exist"
        );

        certificates[_certificateId].revoked = true;

        emit CertificateRevoked(
            _certificateId
        );
    }

    function getCertificateCount()
        public
        view
        returns (uint256)
    {
        return certificateIds.length;
    }

    function getCertificateId(
        uint256 index
    )
        public
        view
        returns (string memory)
    {
        require(
            index < certificateIds.length,
            "Index out of bounds"
        );

        return certificateIds[index];
    }

    function getCertificate(
        string memory _certificateId
    )
        public
        view
        returns (
            string memory certificateId,
            string memory studentName,
            string memory degree,
            string memory department,
            string memory university,
            string memory certificateHash,
            string memory issuer,
            uint256 issueDate,
            bool revoked
        )
    {
        Certificate memory certificate =
            certificates[_certificateId];

        return (
            certificate.certificateId,
            certificate.studentName,
            certificate.degree,
            certificate.department,
            certificate.university,
            certificate.certificateHash,
            certificate.issuer,
            certificate.issueDate,
            certificate.revoked
        );
    }
}