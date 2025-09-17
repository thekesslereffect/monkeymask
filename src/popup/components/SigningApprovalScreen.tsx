import React from 'react';

interface SigningApprovalScreenProps {
  request: {
    id: string;
    origin: string;
    type: 'signMessage' | 'signBlock';
    data: {
      message?: string;
      display?: string;
      block?: any;
      account?: string;
      publicKey?: string;
      origin: string;
    };
  };
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const SigningApprovalScreen: React.FC<SigningApprovalScreenProps> = ({
  request,
  onApprove,
  onReject
}) => {
  const handleApprove = () => {
    onApprove(request.id);
  };

  const handleReject = () => {
    onReject(request.id);
  };

  // Extract domain from origin for display
  const domain = request.origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  const isMessageSigning = request.type === 'signMessage';

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-xl p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl">{isMessageSigning ? '📝' : '✍️'}</div>
          </div>
          <h1 className="text-xl font-bold text-center">
            {isMessageSigning ? 'Sign Message' : 'Sign Block'}
          </h1>
          <p className="text-center text-yellow-100 mt-2">
            {isMessageSigning ? 'A website wants you to sign a message' : 'A website wants you to sign a block'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Site Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                {domain.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{domain}</div>
                <div className="text-sm text-gray-500">{request.origin}</div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-blue-800 font-semibold mb-2">Signing with account:</div>
            <div className="font-mono text-sm text-blue-900">
              {(request.data.publicKey || request.data.account || 'Unknown').slice(0, 12)}...
              {(request.data.publicKey || request.data.account || 'Unknown').slice(-8)}
            </div>
          </div>

          {/* Content to Sign */}
          {isMessageSigning ? (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Message to sign:</h3>
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  Display format: {request.data.display || 'utf8'}
                </div>
                <div className="font-mono text-sm bg-white border rounded p-3 max-h-32 overflow-y-auto">
                  {request.data.message || 'No message provided'}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Block to sign:</h3>
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="font-mono text-xs bg-white border rounded p-3 max-h-32 overflow-y-auto">
                  <pre>{JSON.stringify(request.data.block || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-red-600 mr-3">🚨</div>
              <div className="text-sm text-red-800">
                <div className="font-semibold mb-1">Verify before signing</div>
                <div>
                  {isMessageSigning 
                    ? 'Signing this message proves you own this account. Only sign messages you understand and trust.'
                    : 'Signing this block will authorize a blockchain transaction. Make sure you understand what this block does.'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleReject}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all"
            >
              Sign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
